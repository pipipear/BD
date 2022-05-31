/**
 * @name HighVis
 * @author Pi
 * @description Keeps track of invisible accounts
 * @website https://github.com/pipipear/BD
 * @source https://github.com/pipipear/BD/tree/main/Plugins/HighVis
 */


class HighVis {
  getVersion = () => '1.0.0' // Zlibary requires a quoted string

  invisArray = []
  presDedupe = []
  msgConsec  = []

  log = (m)          => ZLibrary?.Logger.log('HighVis', m)
  get = (key)        => BdApi.getData('HighVis', key)
  set = (key, value) => BdApi.setData('HighVis', key, value)

  status = (id) => ZLibrary?.DiscordModules.UserStatusStore.getState().clientStatuses[id]
  user   = (id) => ZLibrary?.DiscordModules.UserStore.getUser(id)

  addInvis = (id) => {
    if (this.invisArray.includes(id)) return
    this.invisArray.push(id)
    this.set('invisArray', this.invisArray)
  }

  remInvis = (id) => {
    if (!this.invisArray.includes(id)) return
    _.pull(this.invisArray, id)
    this.set('invisArray', this.invisArray)
  }

  invisLog = (id) => {
    if (!id) return
    this.status(id) ? this.remInvis(id) : this.addInvis(id)
  }

  typingStart = ({ userId }) => {
    if (this.user(userId)?.bot) return
    this.invisLog(userId)
  }

  messageReactionAdd = ({ userId, optimistic }) => {
    if (optimistic || this.user(userId)?.bot) return
    this.invisLog(userId)
  }

  voiceStateUpdates = ({ voiceStates }) => {
    voiceStates.forEach(({ channelId, userId }) => {
      if (!channelId || this.user(userId)?.bot) return
      this.invisLog(userId)
    })
  }

  presenceUpdates = async ({ updates }) => {
    let id = updates[0].user.id
    let status = updates[0].status
    if (status == this.presDedupe[id]) return
    this.presDedupe[id] = status
    if (status == 'offline') return
    if (this.user(id)?.bot) return
    this.invisLog(id)
  }

  messageCreate = ({ message, optimistic }) => {
    var id = message.author.id
    if (optimistic) return
    if (message.author.bot) {
      this.invisLog(message.interaction?.user.id)  // slash commands
    } else {
      if (
        this.msgConsec[message.channelId] == id ||
        message.message_reference               || // message can only be pinned/replied in app
        message.sticker_items?.length           || // stickers must be sent in app
        message.mention_roles?.length           || // mentions & emotes are hard in notifs
        message.mentions?.length                ||
        message.content?.match(/<(?::\w{2,32}:|#)[0-9]{17,22}>/)
      ) {
        this.invisLog(id)
      } else {
        this.msgConsec[message.channelId] = id
      }
    }
  }

  messageUpdate = ({ message, optimistic }) => {
    // message updates may contain only a subset of the full message object payload
    if (optimistic || !message.author || message.author.bot) return
    // hack to differentiate between edits and pins
    if ((Date.now() - new Date(message.edited_timestamp || 0)) > 5000) return
    this.invisLog(message.author.id)
  }

  async start() {
    if (!window.ZeresPluginLibrary) return BdApi.alert('ZeresPluginLibrary Missing',
    'The library plugin needed for HighVis is missing.\n\n' +
    'https://betterdiscord.app/plugin/ZeresPluginLibrary\n\n' +
    'See here to download the library then reload Discord')
    ZLibrary.PluginUpdater.checkForUpdate('HighVis', this.getVersion(),
    'https://raw.githubusercontent.com/pipipear/BD/main/Plugins/HighVis/HighVis.plugin.js')
    const HVG = window.HighVis = {}
    HVG.this = this
    const Dispatcher = ZLibrary.DiscordModules.Dispatcher
    this.invisArray = this.get('invisArray') || []

    Dispatcher.subscribe('TYPING_START', this.typingStart)
    Dispatcher.subscribe('MESSAGE_REACTION_ADD', this.messageReactionAdd)
    Dispatcher.subscribe('VOICE_STATE_UPDATES', this.voiceStateUpdates)
    Dispatcher.subscribe('PRESENCE_UPDATES', this.presenceUpdates)
    Dispatcher.subscribe('MESSAGE_CREATE', this.messageCreate)
    Dispatcher.subscribe('MESSAGE_UPDATE', this.messageUpdate)

    BdApi.injectCSS('HighVis-CSS', `
      [aria-label$="Invisible"]>svg rect[mask] {
        fill: hsl(282 calc(var(--saturation-factor, 1) * 49%) 64%) !important;
      }
    `)
    
    HVG.MemberClasses = ZLibrary.WebpackModules.getByProps("member", "lostPermission")
    HVG.MemberListItem = await ZLibrary.ReactComponents.getComponentByName('MemberListItem', `.${HVG.MemberClasses.member}`)
    if (!BdApi.Plugins.isEnabled('HighVis')) return this.log('stopped before start completed')
    HVG.PrivateChannel = ZLibrary.WebpackModules.getByProps("DirectMessage")
    HVG.MemberListItemRender = HVG.MemberListItem.component.prototype.render
    HVG.PrivateChannelRender = HVG.PrivateChannel.default.prototype.render
    HVG.MemberListItem.component.prototype.render = function() {
      if (this.props.status == 'offline' && this.props.isTyping) this.props.status = 'invisible'
      if (this.props.status == 'offline' && window.HighVis.this.invisArray.includes(this.props.user.id)) this.props.status = 'invisible'
      return HVG.MemberListItemRender.apply(this, arguments)
    }
    HVG.PrivateChannel.default.prototype.render = function() {
      if (this.props.status == 'offline' && this.props.isTyping) this.props.status = 'invisible'
      if (this.props.status == 'offline' && window.HighVis.this.invisArray.includes(this.props.user.id)) this.props.status = 'invisible'
      return HVG.PrivateChannelRender.apply(this, arguments)
    }

    this.log('started')
  }

  stop() {
    if (!ZeresPluginLibrary) return
    const HVG = window.HighVis
    const Dispatcher = ZLibrary.DiscordModules.Dispatcher

    Dispatcher.unsubscribe('TYPING_START', this.typingStart)
    Dispatcher.unsubscribe('MESSAGE_REACTION_ADD', this.messageReactionAdd)
    Dispatcher.unsubscribe('VOICE_STATE_UPDATES', this.voiceStateUpdates)
    Dispatcher.unsubscribe('PRESENCE_UPDATES', this.presenceUpdates)
    Dispatcher.unsubscribe('MESSAGE_CREATE', this.messageCreate)
    Dispatcher.unsubscribe('MESSAGE_UPDATE', this.messageUpdate)

    BdApi.clearCSS('HighVis-CSS')
    HVG.MemberListItem && (HVG.MemberListItem.component.prototype.render = HVG.MemberListItemRender)
    HVG.PrivateChannel && (HVG.PrivateChannel.default.prototype.render = HVG.PrivateChannelRender)
    this.log('stopped')
  }
}
