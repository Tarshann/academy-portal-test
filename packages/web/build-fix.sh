#!/bin/sh
# Fix ESLint formatter issue by modifying react-scripts
sed -i 's/formatter = require.resolve("react-dev-utils\/eslintFormatter");/formatter = null;/g' ./node_modules/react-scripts/config/webpack.config.js
# Run the actual build command
cross-env CI=false GENERATE_SOURCEMAP=false react-scripts build
