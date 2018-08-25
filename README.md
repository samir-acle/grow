# Social Pressure

WIP

Installation
```ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin "[\"http://localhost:1234\"]"```
```ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods "[\"PUT\", \"POST\", \"GET\"]"```

Startup Instructions
```open terminal of choice```
```clone directory and cd```
```ipfs add FirstPledgeTokenDetails.json```
```ipfs daemon```
```open new terminal window```
```ganache-cli```
```open new terminal window```
```truffle migrate```
```parcel index.html```   check whether need ---no-cache

Testing
```truffle test```
```npm test```
