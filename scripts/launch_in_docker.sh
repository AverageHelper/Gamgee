#!/bin/bash
set -euo pipefail

DATABASE_FILENAME="$(echo $DATABASE_URL | sed "s/file://g")"
if [[ ! -f $DATABASE_FILENAME ]] ; then
  echo 'No database detected, starting firstrun...'
  npm run firstrun:runtime
else
  echo 'Applying migrations...'
  npm run migrate
  node .
fi
