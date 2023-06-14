'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { getModule, getAllModules, getModuleByDisplayName, React, ReactDOM } = require('vendetta/webpack');
const { getOwnerInstance, getReactInstance } = require('vendetta/util');
const { inject, uninject } = require('vendetta/injector');

const PluginData = {};

const Patcher = require('./Patcher');

class BdApi {
  static get React() {
    return React;
  }

  static get ReactDOM() {
    return ReactDOM;
  }

  static get Patcher() {
    return Patcher;
  }

  static getCore() {
    return null;
  }

  static escapeID(id) {
    return id.replace(/^[^a-z]+|[^\w-]+/giu, '');
  }

  static suppressErrors(method, message = '') {
    return (...params) => {
      try {
        return method(...params);
      } catch (err) {
        BdApi.__error(err, `Error occurred in ${message}`);
      }
    };
  }

  static testJSON(data) {
    try {
      JSON.parse(data);
      return true;
    } catch (err) {
      return false;
    }
  }

  static get __styleParent() {
    return BdApi.__elemParent('style');
  }

  static injectCSS(id, css) {
    const style = document.createElement('style');
    style.id = `bd-style-${BdApi.escapeID(id)}`;
    style.innerHTML = css;
    BdApi.__styleParent.append(style);
  }

  static clearCSS(id) {
    const elem = document.getElementById(`bd-style-${BdApi.escapeID(id)}`);
    if (elem) elem.remove();
  }

  static get __scriptParent() {
    return BdApi.__elemParent('script');
  }

  static linkJS(id, url) {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.id = `bd-script-${BdApi.escapeID(id)}`;
      script.src = url;
      script.type = 'text/javascript';
      script.onload = resolve;
      BdApi.__scriptParent.append(script);
    });
  }

  static unlinkJS(id) {
    const elem = document.getElementById(`bd-script-${BdApi.escapeID(id)}`);
    if (elem) elem.remove();
  }

  static get __pluginData() {
    return PluginData;
  }

  static __getPluginConfigPath(pluginName) {
    return path.join(__dirname, '..', 'config', pluginName + '.config.json');
  }

  static __getPluginConfig(pluginName) {
    const configPath = BdApi.__getPluginConfigPath(pluginName);

    if (typeof BdApi.__pluginData[pluginName] === 'undefined') {
      if (!fs.existsSync(configPath)) {
        BdApi.__pluginData[pluginName] = {};
      } else {
        try {
          BdApi.__pluginData[pluginName] = JSON.parse(fs.readFileSync(configPath));
        } catch (e) {
          BdApi.__pluginData[pluginName] = {};
          BdApi.__warn(`${pluginName} has corrupted or empty config file, loaded as {}`);
        }
      }
    }

    return BdApi.__pluginData[pluginName];
  }

  static __savePluginConfig(pluginName) {
    const configPath = BdApi.__getPluginConfigPath(pluginName);
    const configFolder = path.join(__dirname, '..', 'config/');

   
