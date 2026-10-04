#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

docker build -t reality-app-fe:local .
sudo docker save reality-app-fe:local | sudo k3s ctr images import -
kubectl rollout restart deployment/reality-app-fe -n reality-app
kubectl rollout status deployment/reality-app-fe -n reality-app
