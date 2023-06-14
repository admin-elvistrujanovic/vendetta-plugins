'use strict'

const { React } = require('Vendetta/webpack')
const { SwitchItem } = require('Vendetta/components/settings')

const PluginList = require('./PluginList.jsx')

module.exports = class Settings extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div>
        <SwitchItem
          value={this.props.getSetting('disableWhenStopFailed')}
          onChange={() => this.props.toggleSetting('disableWhenStopFailed')}
        >
          Disable plugin when failed to stop
        </SwitchItem>
        <PluginList pluginManager={window.pluginModule} />
      </div>
    )
  }
}
