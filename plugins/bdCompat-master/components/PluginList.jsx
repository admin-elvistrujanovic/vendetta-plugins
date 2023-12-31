'use strict'

const { shell: { openPath } } = require('electron')

const { React } = require('Vendetta/webpack')
const { Button } = require('Vendetta/components')
const { TextInput } = require('Vendetta/components/settings')

const Plugin = require('./Plugin.jsx')

module.exports = class PluginList extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      search: '',
    }
  }

  render() {
    const plugins = this.__getPlugins()

    return (
      <div className='Vendetta-entities-manage Vendetta-text'>
        <div className='Vendetta-entities-manage-header'>
          <Button
            onClick={() => openPath(window.ContentManager.pluginsFolder)}
            size={Button.Sizes.SMALL}
            color={Button.Colors.PRIMARY}
            look={Button.Looks.OUTLINED}
          >
            Open Plugins Folder
          </Button>
        </div>
        <div className='Vendetta-entities-manage-search'>
          <TextInput
            value={this.state.search}
            onChange={(val) => this.setState({ search: val })}
            placeholder='What are you looking for?'
          >
            Search plugins
          </TextInput>
        </div>

        <div className='Vendetta-entities-manage-items'>
          {plugins.map((plugin) => (
            <Plugin
              plugin={plugin.plugin}
              meta={plugin}
              onEnable={() => this.props.pluginManager.startPlugin(plugin.plugin.getName())}
              onDisable={() => this.props.pluginManager.stopPlugin(plugin.plugin.getName())}
              onDelete={() => this.__deletePlugin(plugin.plugin.getName())}
            />
          ))}
        </div>
      </div>
    )
  }

  __getPlugins() {
    let plugins = Object.keys(window.bdplugins).map((plugin) => window.bdplugins[plugin])

    if (this.state.search !== '') {
      const search = this.state.search.toLowerCase()

      plugins = plugins.filter(
        ({ plugin }) =>
          plugin.getName().toLowerCase().includes(search) ||
          plugin.getAuthor().toLowerCase().includes(search) ||
          plugin.getDescription().toLowerCase().includes(search)
      )
    }

    return plugins.sort((a, b) => {
      const nameA = a.plugin.getName().toLowerCase()
      const nameB = b.plugin.getName().toLowerCase()

      if (nameA < nameB) return -1
      if (nameA > nameB) return 1

      return 0
    })
  }

  __deletePlugin(pluginName) {
    this.props.pluginManager.stopPlugin(pluginName)
    this.props.pluginManager.deletePlugin(pluginName)

    this.forceUpdate()
  }
}
