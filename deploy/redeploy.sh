#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

docker build --build-arg REACT_APP_API_BASE_URL=http://192.168.1.233 -t reality-app-fe:local .
sudo docker save reality-app-fe:local | sudo k3s ctr images import -
kubectl rollout restart deployment/reality-app-fe -n reality-app
kubectl rollout status deployment/reality-app-fe -n reality-app
