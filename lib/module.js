const { join } = require('path')
const nodeExternals = require('webpack-node-externals')

module.exports = function (moduleOptions) {
  // Fetch `apollo` option from `nuxt.config.js`
  const options = this.options.apollo || moduleOptions
  // Check network interfaces valid definition
  const { clientConfigs } = options
  if (Object.keys(clientConfigs).length === 0) {
    throw new Error(
      '[Apollo module] No clientConfigs found in apollo configuration'
    )
  }
  if (!clientConfigs.default) {
    throw new Error(
      '[Apollo module] No default client configuration found in apollo configuration'
    )
  }

  // // Sanitize clientConfigs option
  Object.keys(clientConfigs).forEach(key => {
    const clientConfig = clientConfigs[key]

    if (typeof clientConfig !== 'object') {
      if (
        typeof clientConfig !== 'string' ||
        (typeof clientConfig === 'string' && /^https?:\/\//.test(clientConfig))
      ) {
        throw new Error(
          `[Apollo module] Client configuration "${key}" should be an object or a path to an exported Apollo Client config.`
        )
      }
    } else {
      if (
        typeof clientConfig.httpEndpoint !== 'string' ||
        (typeof clientConfig.httpEndpoint === 'string' &&
          /^https?:\/\//.test(clientConfig))
      ) {
        if (
          typeof clientConfig.link !== 'string' ||
          (typeof clientConfig.link === 'string' &&
            /^https?:\/\//.test(clientConfig))
        ) {
          throw new Error(
            `[Apollo module] Client configuration "${key}" must define httpEndpoint or link option.`
          )
        }
      }
    }
  })
  options.tokenName = options.tokenName || 'apollo-token'
  options.authenticationType = options.authenticationType || 'Bearer'
  // Add plugin for vue-apollo
  this.addPlugin({
    options,
    src: join(__dirname, './templates/plugin.js'),
    fileName: 'apollo-module.js'
  })

  // Add vue-apollo and apollo-client in common bundle
  this.addVendor(['vue-apollo', 'js-cookie', 'cookie'])

  // Add graphql loader
  this.extendBuild((config, { isServer }) => {
    config.resolve.extensions = config.resolve.extensions.concat(
      '.graphql',
      '.gql'
    )
    const gqlRules = {
      test: /\.(graphql|gql)$/,
      use: 'graphql-tag/loader',
      exclude: /(node_modules)/
    }
    if (options.includeNodeModules) {
      delete gqlRules.exclude
    }
    config.module.rules.push(gqlRules)
    if (isServer) {
      config.externals = [
        nodeExternals({
          whitelist: [/^vue-cli-plugin-apollo/]
        })
      ]
    }
  })
}
