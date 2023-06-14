const { WebpackModules, React, ReactDOM } = BdApi;

class V2 {
  static get WebpackModules() {
    return {
      find: WebpackModules.findByUniqueProperties,
      findAll: WebpackModules.findAllByProps,
      findByUniqueProperties: WebpackModules.findByUniqueProperties,
      findByDisplayName: WebpackModules.findByDisplayName,
    };
  }

  static get react() {
    return React;
  }

  static get reactDom() {
    return ReactDOM;
  }

  static get getInternalInstance() {
    return BdApi.getInternalInstance;
  }
}

module.exports = V2;
