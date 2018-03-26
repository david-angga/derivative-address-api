const express = require('express')
const app = express()

var bjs = require('bitcoinjs-lib')
var b58 = require('bs58check')
var fs = require('fs')

// this function takes ypub and turns into xpub
function ypubToXpub(ypub) {
  var data = b58.decode(ypub)
  data = data.slice(4)
  data = Buffer.concat([Buffer.from('0488b21e','hex'), data])
  return b58.encode(data)
}

// this function takes an HDNode, and turns the pubkey of that node into a Segwit P2SH address
function nodeToP2shSegwitAddress(hdNode) {
  var pubkeyBuf = hdNode.keyPair.getPublicKeyBuffer()
  var hash = bjs.crypto.hash160(pubkeyBuf)
  var redeemScript = bjs.script.witnessPubKeyHash.output.encode(hash)
  var hash2 = bjs.crypto.hash160(redeemScript)
  var scriptPubkey = bjs.script.scriptHash.output.encode(hash2)
  return bjs.address.fromOutputScript(scriptPubkey)
}

app.get('/', function(req,res) {
  var path    = require("path");
  
  res.sendFile(path.join(__dirname+'/index.html'));
});

app.get('/ypub/:ypub/amount/:amount', function (req,res) {
  try {
    var xpub = ypubToXpub(req.params.ypub);
  } catch (err) {
    res.send("ypub error!");
  }
  

  var hdNode = bjs.HDNode.fromBase58(xpub);
  try {
    var addresses = [parseInt(req.params.amount)];
  } catch (err) {
    res.send("Amount is not integer!");
  }
  

  for(var i=0; i<parseInt(req.params.amount); i++) {
    // generate as usual, but instead of getAddress, feed into above function
    addresses[i] = nodeToP2shSegwitAddress(hdNode.derive(0).derive(i))
  }

  res.send(JSON.stringify(addresses));

});

app.listen(3000, () => console.log('app listening on port 3000!'))