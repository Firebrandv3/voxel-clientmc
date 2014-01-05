WebSocket = require 'ws'
ever = require 'ever'

module.exports = (game, opts) ->
  return new ClientMC(game, opts)

class ClientMC
  constructor: (@game, @opts) ->
    @opts.url ?= 'ws://localhost:1234'
    @enable()

  enable: () ->
    @ws = new WebSocket @opts.url
    ever(@ws).on 'open', () ->
      console.log 'WebSocket connected'

    ever(@ws).on 'error', (err) ->
      console.log 'WebSocket error', err

    ever(@ws).on 'message', (event, flags) ->
      packet = JSON.parse event.data
      [name, payload] = packet

      if name == 'map_chunk_bulk'
        console.log 'map_chunk_bulk',payload.data.compressedChunkData.length

  disable: () ->
    #@ws.close()

