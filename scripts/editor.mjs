import {campaign, saveCampaign, ENTRY_TYPES, newId} from "./data.mjs";
import {esc, clamp, safeAsset, icon} from "./utils.mjs";
import {syncLandingBackground} from "./scene.mjs";

const {ApplicationV2, HandlebarsApplicationMixin, DialogV2} = foundry.applications.api;
const FilePicker = foundry.applications.apps.FilePicker;
const NAV = [{id:"general",label:"Overview",icon:"fa-house"},{id:"characters",label:"Characters",icon:"fa-users"},{id:"locations",label:"World Map",icon:"fa-map"},{id:"quests",label:"Quests",icon:"fa-scroll"},{id:"recaps",label:"Recaps",icon:"fa-book-open"},{id:"cinematic",label:"Cinematic & Audio",icon:"fa-music"}];
let editorInstance = null;
export function openEditor() {
  if(!game.user?.isGM) {ui.notifications?.warn("Only the GM can edit the landing page.");return;}
  if(editorInstance?.rendered) {editorInstance.bringToFront();return;}
  editorInstance = new AverisLandingEditor();
  editorInstance.render({force:true});
}
function field(name,label,value,{kind="text",min=null,max=null,help="",options=null}={}) {
  const inputName=esc(name);
  const val=esc(value ?? "");
  const hint=help?`<small>${esc(help)}</small>`:"";
  let control;
  if(kind === "textarea") control=`<textarea name="${inputName}" rows="4">${val}</textarea>`;
  else if(kind === "checkbox") control=`<label class="av-switch"><input name="${inputName}" type="checkbox" ${value?"checked":""}> Enabled</label>`;
  else if(kind === "select") control=`<select name="${inputName}">${(options||[]).map(o=>`<option value="${esc(typeof o==="string"?o:o.value)}" ${(typeof o==="string"?o:o.value)===value?"selected":""}>${esc(typeof o==="string"?o:o.label)}</option>`).join("")}</select>`;
  else control=`<div class="av-edit-input-line"><input type="${kind==="number"?"number":"text"}" name="${inputName}" value="${val}" ${min!==null?`min="${min}"`:""} ${max!==null?`max="${max}"`:""} ${kind==="number"?'step="any"':""}>${["image","audio"].includes(kind)?`<button type="button" class="av-browse" data-av-browse="${inputName}" data-av-filetype="${kind}" title="Browse files">${icon("fa-folder-open")}</button>`:""}</div>`;
  return `<label class="av-edit-field"><span>${esc(label)}</span>${control}${hint}</label>`;
}
function heroSettings(data) {
  return `<div class="av-edit-form-panel"><h2>Campaign Overview</h2><p>General information shown in your Averis Foundry Scene.</p><form data-av-setting-form="general">${field("title","Campaign Title",data.title)}${field("subtitle","Campaign Subtitle",data.subtitle)}${field("worldDay","World Day",data.worldDay??18)}${field("worldMonth","World Month",data.worldMonth??2)}${field("worldYear","Current World Year",data.worldYear)}${field("introduction","Landing Page Introduction",data.introduction,{kind:"textarea"})}${field("backgroundImage","Landing Scene Background (optional override)",data.backgroundImage,{kind:"image",help:"Leave empty to use the bundled World Tree art. Setting this updates the native Landing Scene background."})}${field("mapImage","World Map Image",data.mapImage,{kind:"image",help:"Map coordinates are percentages; choose your canonical map before positioning markers."})}<div class="av-editor-actions"><button type="submit" class="av-save">Save Overview</button></div></form></div>`;
}
function cinematicSettings(data) {
  return `<div class="av-edit-form-panel"><h2>Session Intro & Sound</h2><p>Start Session broadcasts a synchronized title card, then activates the selected scene.</p><form data-av-setting-form="cinematic">${field("chapterTitle","Chapter Title",data.chapterTitle)}${field("chapterSubtitle","Chapter Subtitle",data.chapterSubtitle)}${field("targetSceneId","Scene to Activate",data.targetSceneId,{kind:"select",options:[{value:"",label:"No scene activation"},...game.scenes.contents.map(s=>({value:s.id,label:s.name}))]})}${field("cinematicSeconds","Cinematic Duration (seconds)",data.cinematicSeconds,{kind:"number",min:2,max:20})}${field("landingMusic","Custom Music Path (optional)",data.landingMusic,{kind:"audio"})}${field("cinematicMusic","Cinematic Music (audio path)",data.cinematicMusic,{kind:"audio"})}${field("volume","Default Sound Volume (0-1)",data.volume,{kind:"number",min:0,max:1})}${field("particles","Animated Dust & Particles",data.particles,{kind:"checkbox"})}<div class="av-editor-actions"><button type="submit" class="av-save">Save Intro & Sound</button></div></form></div>`;
}
function blank(type) {
  const result = {id:newId()};
  for(const fld of ENTRY_TYPES[type].fields) {
    if(fld.kind==="checkbox") result[fld.name]=true;
    else if(fld.kind==="number") result[fld.name]=type==="locations"?50:0;
    else result[fld.name]=fld.values?.[0]??"";
  }
  return result;
}
function entryFormFields(type, entry) {
  return ENTRY_TYPES[type].fields.map(f => {
    if(type==="characters" && f.name==="actorId") {
      const choices=[{value:"",label:"Manual portrait / no Actor"},
        ...(game.actors?.contents??[]).filter(a=>a.type==="character")
          .sort((a,b)=>a.name.localeCompare(b.name))
          .map(a=>({value:a.id,label:a.name}))];
      if(entry.actorId&&!choices.some(o=>o.value===entry.actorId))choices.push({value:entry.actorId,label:`Missing Actor (${entry.actorId})`});
      return field(f.name,"Foundry Character Actor",entry[f.name],{kind:"select",options:choices});
    }
    return field(f.name,f.label,entry[f.name],{kind:f.kind,min:f.min,max:f.max,options:f.values});
  }).join("");
}
function entryEditor(data, type, selectedId) {
  const cfg=ENTRY_TYPES[type];
  const items=data[type] || [];
  const selected=items.find(e=>e.id===selectedId) || null;
  const current=selected || blank(type);
  const preview=type==="locations"?mapPicker(data,current):"";
  const list=items.map(e=>`<button type="button" class="av-editor-entry ${selected?.id===e.id?"is-selected":""}" data-av-select="${esc(e.id)}"><strong>${esc(e[cfg.titleField]||"Untitled")}</strong><small>${esc(type==="recaps"?`Session ${e.session}`:type==="quests"?e.status:type==="locations"?(e.discovered?"Discovered":"Hidden"):e.subtitle||"")}</small></button>`).join("");
  return `<div class="av-editor-collection"><div class="av-editor-list"><div class="av-editor-list-head"><strong>${esc(cfg.singular)} Entries (${items.length})</strong>${type==="characters"?'<button type="button" data-av-import-actors="true" title="Add Foundry PC Actors to the roster">Import PCs</button>':""}<button type="button" data-av-new="${esc(type)}" title="Add entry">+ Add</button></div>${list||`<p class="av-muted">No entries yet.</p>`}</div><div class="av-edit-form-panel"><h2>${selected?"Edit":"Add"} ${esc(cfg.singular)}</h2><p>Only published content will appear in the player landing page.</p><form data-av-entry-form="${esc(type)}" data-av-id="${selected?.id || current.id}">${entryFormFields(type,current)}${preview}<div class="av-editor-actions"><button type="submit" class="av-save">${selected?"Save Changes":"Add Entry"}</button>${selected?`<button type="button" class="av-danger" data-av-delete="${esc(selected.id)}">Delete</button>`:""}</div></form></div></div>`;
}
function mapPicker(data, entry) {
  const bg=safeAsset(data.mapImage);
  const x=clamp(entry.x,0,100),y=clamp(entry.y,0,100);
  return `<div class="av-edit-pin"><strong>Click to position the marker</strong><p>This changes X and Y in the form above. Save the entry to publish it.</p><div class="av-editor-pinmap" data-av-pinmap="true">${bg?`<img src="${esc(bg)}" alt="Map preview">`:`<div class="av-no-map">No map image selected</div>`}<span class="av-pin-dot" style="left:${x}%;top:${y}%">✦</span></div></div>`;
}
function editorMarkup(data, tab, selectedId) {
  const tabs=NAV.map(n=>`<button type="button" class="${tab===n.id?"av-editor-active":""}" data-av-edit-tab="${n.id}"><i class="fa-solid ${n.icon}"></i>${n.label}</button>`).join("");
  const inner=tab==="general"?heroSettings(data):tab==="cinematic"?cinematicSettings(data):entryEditor(data,tab,selectedId);
  return `<div class="av-editor-shell"><aside class="av-editor-sidebar"><div class="av-editor-logo">⚜ <span>Averis Editor</span></div><nav>${tabs}</nav><div class="av-editor-tools"><button type="button" data-av-export="true">${icon("fa-file-export")} Export Backup</button><button type="button" data-av-import="true">${icon("fa-file-import")} Import Backup</button><input type="file" id="av-editor-import-file" accept=".json,application/json" hidden></div></aside><div class="av-editor-body">${inner}</div></div>`;
}
export class AverisLandingEditor extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS={
    id:"averis-landing-editor",
    classes:["averis-editor-window"],
    window:{title:"Averis | Landing Page Editor",resizable:true,icon:"fa-solid fa-compass"},
    position:{width:1020,height:760}
  };
  static PARTS={main:{template:"modules/averis-landing/templates/editor.hbs"}};
  constructor(options={}) {super(options);this.tab="general";this.selectedId=null;}
  async _prepareContext(options) {return {...await super._prepareContext(options),editorHTML:editorMarkup(campaign(),this.tab,this.selectedId)};}
  _onRender(context,options) {
    super._onRender(context,options);
    this.element.querySelector(".av-editor-content")?.addEventListener("click",event=>void this._onClick(event));
    this.element.querySelectorAll("form").forEach(form=>form.addEventListener("submit",event=>void this._onSubmit(event)));
    this.element.querySelector("#av-editor-import-file")?.addEventListener("change",event=>void this._onImport(event));
  }
  async _renderKeepScroll() {
    const previous=this.element?.querySelector(".av-editor-body")?.scrollTop ?? 0;
    await this.render();
    const body=this.element?.querySelector(".av-editor-body");
    if(body)body.scrollTop=previous;
  }
  async _onClick(event) {
    const marker=event.target.closest("[data-av-pinmap]");
    if(marker) {
      const r=marker.getBoundingClientRect();
      const x=clamp(Math.round((event.clientX-r.left)/r.width*1000)/10,0,100);
      const y=clamp(Math.round((event.clientY-r.top)/r.height*1000)/10,0,100);
      this.element.querySelector('[name="x"]').value=x;
      this.element.querySelector('[name="y"]').value=y;
      marker.querySelector(".av-pin-dot").style.cssText=`left:${x}%;top:${y}%`;
      return;
    }
    const btn=event.target.closest("button");
    if(!btn)return;
    if(btn.dataset.avEditTab) {this.tab=btn.dataset.avEditTab;this.selectedId=null;await this._renderKeepScroll();return;}
    if(btn.dataset.avSelect) {this.selectedId=btn.dataset.avSelect;await this._renderKeepScroll();return;}
    if(btn.dataset.avNew) {this.selectedId=null;await this._renderKeepScroll();return;}
    if(btn.dataset.avDelete) {await this._delete(btn.dataset.avDelete);return;}
    if(btn.dataset.avImportActors) {
      const data=campaign();
      let imported=0;
      for(const actor of (game.actors?.contents??[]).filter(a=>a.type==="character")) {
        const already=data.characters.find(c=>c.actorId===actor.id || c.name.toLowerCase().trim()===actor.name.toLowerCase().trim());
        if(already) {
          if(!already.actorId)already.actorId=actor.id;
          continue;
        }
        data.characters.push({id:newId(),name:actor.name,subtitle:"Adventurer",portrait:"",description:"",actorId:actor.id,visible:true,dead:false});
        imported++;
      }
      await saveCampaign(data);
      ui.notifications?.info(`Averis: Imported ${imported} new characters and linked matching roster entries.`);
      await this._renderKeepScroll();
      return;
    }
    if(btn.dataset.avBrowse) {
      const input=this.element.querySelector(`[name="${btn.dataset.avBrowse}"]`);
      if(input) new FilePicker({type:btn.dataset.avFiletype||"image",current:input.value,callback:path=>{input.value=path;input.dispatchEvent(new Event("change",{bubbles:true}));}}).render({force:true});
      return;
    }
    if(btn.dataset.avExport) {this._export();return;}
    if(btn.dataset.avImport) {this.element.querySelector("#av-editor-import-file")?.click();}
  }
  async _onSubmit(event) {
    event.preventDefault();
    if(!game.user.isGM) return;
    const form=event.currentTarget;
    const formData=new FormData(form);
    const data=campaign();
    if(form.dataset.avSettingForm==="general") {
      for(const key of ["title","subtitle","worldDay","worldMonth","worldYear","introduction","backgroundImage","mapImage"]) data[key]=String(formData.get(key)??"").trim();
    } else if(form.dataset.avSettingForm==="cinematic") {
      for(const key of ["chapterTitle","chapterSubtitle","targetSceneId","landingMusic","cinematicMusic"]) data[key]=String(formData.get(key)??"").trim();
      data.cinematicSeconds=clamp(formData.get("cinematicSeconds"),2,20);
      data.volume=clamp(formData.get("volume"),0,1);
      data.particles=formData.has("particles");
    } else if(form.dataset.avEntryForm) {
      const type=form.dataset.avEntryForm;
      const cfg=ENTRY_TYPES[type];
      if(!cfg)return;
      const id=form.dataset.avId || newId();
      const entry={id};
      for(const f of cfg.fields) {
        if(f.kind==="checkbox")entry[f.name]=formData.has(f.name);
        else if(f.kind==="number")entry[f.name]=clamp(formData.get(f.name),f.min??0,f.max??100);
        else entry[f.name]=String(formData.get(f.name)??"").trim();
      }
      if(!entry[cfg.fields.find(f=>f.required)?.name]) {ui.notifications?.warn("Fill in the required name / title.");return;}
      const idx=data[type].findIndex(v=>v.id===id);
      if(idx>=0)data[type][idx]=entry;
      else data[type].push(entry);
      this.selectedId=id;
    } else return;
    try {await saveCampaign(data);if(form.dataset.avSettingForm==="general")await syncLandingBackground(data.backgroundImage,{force:true});ui.notifications?.info("Averis Landing: Changes saved.");await this._renderKeepScroll();}
    catch(error){console.error("Averis Landing | Save failed:",error);ui.notifications?.error("Averis Landing: Save failed.");}
  }
  async _delete(id) {
    const item=campaign()[this.tab].find(e=>e.id===id);
    if(!item || !game.user.isGM)return;
    const confirmed=await DialogV2.confirm({window:{title:"Delete landing entry"},content:`Delete <strong>${esc(item.name||item.title)}</strong>? This cannot be undone unless you have a backup.`,rejectClose:false});
    if(!confirmed)return;
    const data=campaign();
    data[this.tab]=data[this.tab].filter(e=>e.id!==id);
    await saveCampaign(data);
    this.selectedId=null;
    await this._renderKeepScroll();
  }
  _export() {
    const json=JSON.stringify(campaign(),null,2);
    const blob=new Blob([json],{type:"application/json"});
    const href=URL.createObjectURL(blob);
    const anchor=document.createElement("a");
    anchor.href=href;anchor.download="averis-landing-backup.json";
    document.body.append(anchor);anchor.click();anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(href),1000);
  }
  async _onImport(event) {
    const file=event.target.files?.[0];
    if(!file)return;
    if(file.size>2_000_000) {ui.notifications?.warn("Backup is too large (max 2 MB).");return;}
    try {
      const parsed=JSON.parse(await file.text());
      if(!parsed || typeof parsed!=="object" || Array.isArray(parsed) || !["characters","quests","recaps","locations"].every(k=>Array.isArray(parsed[k])) || typeof parsed.title!=="string") throw new Error("Invalid backup format");
      const confirmed=await DialogV2.confirm({window:{title:"Import campaign backup"},content:"Replace ALL existing Averis Landing content with the selected backup? Export a backup first if you want to keep it.",rejectClose:false});
      if(!confirmed)return;
      await saveCampaign(parsed);
      this.selectedId=null;
      await this.render();
      ui.notifications?.info("Averis Landing: Backup imported.");
    } catch(error) {console.error("Averis Landing | Import error",error);ui.notifications?.error("Cannot import this backup JSON.");}
    finally{event.target.value="";}
  }
}
