const { webFrame } = require('electron')
const { join } = require('path')
const { Module } = require('module')
const { existsSync, readdirSync, unlinkSync } = require('fs')
const { getModule, FluxDispatcher, inject, uninject } = require('vendetta')
const { MutationObserver } = require('@sheerun/mutationobserver-shim')

// Allow loading from Discord's node_modules
Module.globalPaths.push(join(process.resourcesPath, 'app.asar/node_modules'))

module.exports = class VendettaPluginManager {
  constructor(pluginsFolder, settings) {
    this.folder = pluginsFolder
    this.settings = settings

    FluxDispatcher.subscribe('CHANNEL_SELECT', this.channelSwitch = () => this.fireEvent('onSwitch'))

    this.observer = new MutationObserver((mutations) => {
      for (let i = 0, mlen = mutations.length; i < mlen; i++) this.fireEvent('observer', mutations[i])
    })
    this.observer.observe(document, { childList: true, subtree: true })

    // Wait for jQuery, then load the plugins
    window.BdApi.linkJS('jquery', '//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js')
      .then(async () => {
        this.__log('Loaded jQuery')

        if (!window.jQuery) {
          Object.defineProperty(window, 'jQuery', {
            get: () => webFrame.top.context.window.jQuery
          })
          window.$ = window.jQuery
        }

        const ConnectionStore = await getModule(['isTryingToConnect', 'isConnected'])
        const listener = () => {
          if (!ConnectionStore.isConnected()) return
          ConnectionStore.removeChangeListener(listener)
          this.__log('Loading plugins..')
          this.loadAllPlugins()
          this.startAllEnabledPlugins()
        }
        if (ConnectionStore.isConnected()) listener()
        else ConnectionStore.addChangeListener(listener)
      })
  }

  destroy() {
    window.BdApi.unlinkJS('jquery')
    if (this.channelSwitch) FluxDispatcher.unsubscribe('CHANNEL_SELECT', this.channelSwitch)

    this.observer.disconnect()
    this.stopAllPlugins()
  }

  startAllEnabledPlugins() {
    const plugins = Object.keys(window.bdplugins)

    plugins.forEach((pluginName) => {
      if (window.BdApi.loadData('BDCompat-EnabledPlugins', pluginName) === true) this.startPlugin(pluginName)
    })
  }

  stopAllPlugins() {
    const plugins = Object.keys(window.bdplugins)

    plugins.forEach((pluginName) => {
      this.stopPlugin(pluginName)
    })
  }

  isEnabled(pluginName) {
    const plugin = window.bdplugins[pluginName]
    if (!plugin) return this.__error(null, `Tried to access a missing plugin: ${pluginName}`)

    return plugin.__started
  }

  startPlugin(pluginName) {
    const plugin = window.bdplugins[pluginName]
    if (!plugin) return this.__error(null, `Tried to start a missing plugin: ${pluginName}`)

    if (plugin.__started) return

    try {
      plugin.plugin.start()
      plugin.__started = true
      this.__log(`Started plugin ${plugin.plugin.getName()}`)
    } catch (err) {
      this.__error(err, `Could not start ${plugin.plugin.getName()}`)
      window.BdApi.saveData('BDCompat-EnabledPlugins', plugin.plugin.getName(), false)
    }
  }

  stopPlugin(pluginName) {
    const plugin = window.bdplugins[pluginName]
    if (!plugin) return this
