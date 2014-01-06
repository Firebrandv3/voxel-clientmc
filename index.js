// Generated by CoffeeScript 1.6.3
(function() {
  var ClientMC, decodePacket, ever, minecraft_protocol, onesInShort, websocket_stream, zlib;

  websocket_stream = require('websocket-stream');

  minecraft_protocol = require('minecraft-protocol');

  ever = require('ever');

  zlib = require('zlib-browserify');

  module.exports = function(game, opts) {
    return new ClientMC(game, opts);
  };

  module.exports.pluginInfo = {
    loadAfter: ['voxel-land', 'voxel-player', 'voxel-registry']
  };

  decodePacket = function(data) {
    var buffer, id, name, payload, result;
    if (!(data instanceof Uint8Array)) {
      return void 0;
    }
    data._isBuffer = true;
    buffer = new Buffer(data);
    result = minecraft_protocol.protocol.parsePacket(buffer);
    if (!result || result.error) {
      console.log('protocol parse error: ' + JSON.stringify(result.error));
      return void 0;
    }
    payload = result.results.data;
    id = result.results.id;
    name = minecraft_protocol.protocol.packetNames[minecraft_protocol.protocol.states.PLAY].toClient[id];
    return {
      name: name,
      id: id,
      payload: payload
    };
  };

  onesInShort = function(n) {
    var count, i, _i;
    n = n & 0xffff;
    count = 0;
    for (i = _i = 0; _i <= 16; i = ++_i) {
      count += +((1 << i) & n);
    }
    return count;
  };

  ClientMC = (function() {
    function ClientMC(game, opts) {
      var _base, _base1, _ref;
      this.game = game;
      this.opts = opts;
      this.registry = (function() {
        var _ref1;
        if ((_ref = (_ref1 = this.game.plugins) != null ? _ref1.get('voxel-registry') : void 0) != null) {
          return _ref;
        } else {
          throw 'voxel-clientmc requires voxel-registry plugin';
        }
      }).call(this);
      if ((_base = this.opts).url == null) {
        _base.url = 'ws://localhost:1234';
      }
      if ((_base1 = this.opts).mcBlocks == null) {
        _base1.mcBlocks = {
          0: 'air',
          1: 'stone',
          2: 'grass',
          3: 'dirt',
          4: 'cobblestone',
          5: 'planksOak',
          7: 'obsidian',
          16: 'oreCoal',
          17: 'logOak',
          18: 'leavesOak',
          161: 'leavesOak',
          162: 'logOak',
          "default": 'brick'
        };
      }
      this.unrecognizedBlocks = {};
      this.enable();
    }

    ClientMC.prototype.enable = function() {
      var _ref, _ref1, _ref2,
        _this = this;
      if ((_ref = this.game.plugins) != null) {
        _ref.disable('voxel-land');
      }
      if ((_ref1 = this.game.plugins) != null) {
        _ref1.get('voxel-player').moveTo(-289, 80, -340);
      }
      if ((_ref2 = this.game.plugins) != null) {
        _ref2.enable('voxel-fly');
      }
      this.ws = websocket_stream(this.opts.url, {
        type: Uint8Array
      });
      this.game.voxels.on('missingChunk', this.missingChunk.bind(this));
      this.voxelChunks = {};
      this.ws.on('error', function(err) {
        return console.log('WebSocket error', err);
      });
      return this.ws.on('data', function(data) {
        var packet;
        packet = decodePacket(data);
        if (packet == null) {
          return;
        }
        return _this.handlePacket(packet.name, packet.payload);
      });
    };

    ClientMC.prototype.disable = function() {
      this.game.voxels.removeListener('missingChunk', this.missingChunk);
      return this.ws.end();
    };

    ClientMC.prototype.handlePacket = function(name, payload) {
      var compressed,
        _this = this;
      if (name === 'map_chunk_bulk') {
        compressed = payload.compressedChunkData;
        if (payload.meta == null) {
          return;
        }
        return zlib.inflate(compressed, function(err, inflated) {
          var i, meta, offset, size, _i, _len, _ref, _results;
          if (err) {
            return err;
          }
          console.log('  decomp', inflated.length);
          offset = meta = size = 0;
          _ref = payload.meta;
          _results = [];
          for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
            meta = _ref[i];
            size = (8192 + (payload.skyLightSent ? 2048 : 0)) * onesInShort(meta.bitMap) + 2048 * onesInShort(meta.addBitMap) + 256;
            _this.addColumn({
              x: meta.x,
              z: meta.z,
              bitMap: meta.bitMap,
              addBitMap: meta.addBitMap,
              skyLightSent: payload.skyLightSent,
              groundUp: true,
              data: inflated.slice(offset, offset + size)
            });
            _results.push(offset += size);
          }
          return _results;
        });
      }
    };

    ClientMC.prototype.addColumn = function(args) {
      var blockName, blockType, chunkX, chunkY, chunkZ, column, dx, dy, dz, miniChunk, offset, ourBlockType, size, vchunkKey, vchunkX, vchunkY, vchunkZ, x, y, z, _i, _results;
      chunkX = args.x;
      chunkZ = args.z;
      console.log('add column', chunkX, chunkZ);
      column = [];
      offset = 0;
      size = 4096;
      _results = [];
      for (chunkY = _i = 0; _i <= 16; chunkY = ++_i) {
        if (args.bitMap & (1 << chunkY)) {
          miniChunk = args.data.slice(offset, offset + size);
          offset += size;
          _results.push((function() {
            var _j, _results1;
            _results1 = [];
            for (dy = _j = 0; _j <= 16; dy = ++_j) {
              _results1.push((function() {
                var _k, _results2;
                _results2 = [];
                for (dz = _k = 0; _k <= 16; dz = ++_k) {
                  _results2.push((function() {
                    var _base, _base1, _l, _ref, _results3;
                    _results3 = [];
                    for (dx = _l = 0; _l <= 16; dx = ++_l) {
                      blockType = miniChunk[dx + dz * 16 + dy * 16 * 16];
                      x = chunkX * 16 + dx;
                      y = chunkY * 16 + dy;
                      z = chunkZ * 16 + dz;
                      _ref = this.game.voxels.chunkAtCoordinates(x, y, z), vchunkX = _ref[0], vchunkY = _ref[1], vchunkZ = _ref[2];
                      vchunkKey = [vchunkX, vchunkY, vchunkZ].join('|');
                      if ((_base = this.voxelChunks)[vchunkKey] == null) {
                        _base[vchunkKey] = new this.game.arrayType(this.game.chunkSize * this.game.chunkSize * this.game.chunkSize);
                      }
                      blockName = this.opts.mcBlocks[blockType];
                      if (blockName == null) {
                        if ((_base1 = this.unrecognizedBlocks)[blockType] == null) {
                          _base1[blockType] = 0;
                        }
                        this.unrecognizedBlocks[blockType] += 1;
                        blockName = this.opts.mcBlocks["default"];
                      }
                      ourBlockType = this.registry.getBlockID(blockName);
                      _results3.push(this.voxelChunks[vchunkKey][dx + dy * this.game.chunkSize + dz * this.game.chunkSize * this.game.chunkSize] = ourBlockType);
                    }
                    return _results3;
                  }).call(this));
                }
                return _results2;
              }).call(this));
            }
            return _results1;
          }).call(this));
        } else {

        }
      }
      return _results;
    };

    ClientMC.prototype.missingChunk = function(pos) {
      var chunk, voxels;
      voxels = this.voxelChunks[pos.join('|')];
      if (voxels == null) {
        return;
      }
      chunk = {
        position: pos,
        dims: [this.game.chunkSize, this.game.chunkSize, this.game.chunkSize],
        voxels: voxels
      };
      return this.game.showChunk(chunk);
    };

    return ClientMC;

  })();

}).call(this);
