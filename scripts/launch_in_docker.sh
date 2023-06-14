#!/bin/bash
DATABASE_FILENAME=$(echo $DATABASE_URL | sed "s/file://g")
if [[ ! -f $DATABASE_FILENAME ]] ; then
  echo "No database detected, starting firstrun..."
  npm run firstrun:runtime
fi
node .
