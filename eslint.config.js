import vuetify from 'eslint-config-vuetify'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'

export default vuetify(
  {
    ts: true,
  },
  eslintPluginPrettier,
)
