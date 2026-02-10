const esbuild = require('esbuild');
const { externalGlobalPlugin } = require('esbuild-plugin-external-global');

esbuild.build({
  entryPoints: ['script.js'],
  bundle: true,
  outfile: 'dist/bundle.js',
  format: 'iife',
  plugins: [
    externalGlobalPlugin({
      'react': 'React',
      'react-dom': 'ReactDOM',
    }),
  ],
}).catch(() => process.exit(1));
