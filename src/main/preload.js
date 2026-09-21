'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

contextBridge.exposeInMainWorld('duct', {
  isElectron: true,
  app: {
    getInfo: () => invoke('app:getInfo'),
    openExternal: (url) => invoke('app:openExternal', url),
    openPath: (p) => invoke('app:openPath', p),
    showItemInFolder: (p) => invoke('app:showItemInFolder', p),
    relaunch: () => invoke('app:relaunch'),
  },
  license: {
    get: () => invoke('license:get'),
    activate: (key) => invoke('license:activate', key),
    activateFile: () => invoke('license:activateFile'),
    remove: () => invoke('license:remove'),
    machineId: () => invoke('license:machineId'),
  },
  settings: {
    get: () => invoke('settings:get'),
    set: (patch) => invoke('settings:set', patch),
  },
  profiles: {
    list: () => invoke('profiles:list'),
    create: (data) => invoke('profiles:create', data),
    update: (id, patch) => invoke('profiles:update', id, patch),
    remove: (id) => invoke('profiles:remove', id),
  },
  supervisor: {
    hasPin: () => invoke('supervisor:hasPin'),
    setPin: (pin) => invoke('supervisor:setPin', pin),
    verifyPin: (pin) => invoke('supervisor:verifyPin', pin),
    clearPin: () => invoke('supervisor:clearPin'),
    listClasses: () => invoke('supervisor:listClasses'),
    createClass: (data) => invoke('supervisor:createClass', data),
    removeClass: (id) => invoke('supervisor:removeClass', id),
    allResults: () => invoke('supervisor:allResults'),
  },
  assignments: {
    list: () => invoke('assignments:list'),
    create: (data) => invoke('assignments:create', data),
    update: (id, patch) => invoke('assignments:update', id, patch),
    remove: (id) => invoke('assignments:remove', id),
  },
  results: {
    get: (profileId) => invoke('results:get', profileId),
    saveAttempt: (profileId, attempt) => invoke('results:saveAttempt', profileId, attempt),
    saveSession: (profileId, session) => invoke('results:saveSession', profileId, session),
    markLesson: (profileId, lessonId) => invoke('results:markLesson', profileId, lessonId),
  },
  classroom: {
    status: () => invoke('classroom:status'),
    chooseFolder: () => invoke('classroom:chooseFolder'),
    setFolder: (folder) => invoke('classroom:setFolder', folder),
    syncNow: () => invoke('classroom:syncNow'),
    importFiles: () => invoke('classroom:importFiles'),
  },
  exporter: {
    csv: (payload) => invoke('export:csv', payload),
    json: (payload) => invoke('export:json', payload),
    pdf: (payload) => invoke('export:pdf', payload),
    defaultDir: () => invoke('export:defaultDir'),
  },
  updates: {
    getState: () => invoke('updates:getState'),
    check: () => invoke('updates:check'),
    download: () => invoke('updates:download'),
    install: () => invoke('updates:install'),
    onEvent: (cb) => {
      const handler = (_e, data) => cb(data);
      ipcRenderer.on('updates:event', handler);
      return () => ipcRenderer.removeListener('updates:event', handler);
    },
  },
});
