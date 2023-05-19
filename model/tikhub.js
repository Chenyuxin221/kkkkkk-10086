import fetch from "node-fetch"
import fs from 'fs'
import common from "../../../lib/common/common.js"
import uploadRecord from "./uploadRecord.js"
const _path = process.cwd()
let accountfile = `${_path}/plugins/kkkkkk-10086/config/config.json`
let file = fs.readFileSync(accountfile, 'utf-8')
let AccountFile = JSON.parse(file)
let username = AccountFile.account //账号
let password = AccountFile.password //密码

export class base {
  constructor(e = {}) {
    this.e = e;
    this.userId = e?.user_id;
  }
}

export default class TikHub extends base {
  constructor(e) {
    super(e);
    this.model = "TikHub";
  }
  /**
   * @param {*} count 过万整除
   * @returns 
   */
  async count(count) {
    if (count > 10000) {
      return (count / 10000).toFixed(1) + "万";
    } else {
      return count.toString();
    }
  }

  /**
 * 
 * @param {*} code douyin()添加的唯一状态码，判断用v1还是v2接口
 * @param {*} is_mp4 douyin()添加的唯一状态码，判断是视频还是图集
 * @param {*} dydata 视频json
 * @returns 
 */
  async gettype(code, is_mp4, dydata) {
    try {
      if (code === 1) {
        await this.v1_dy_data(dydata)
        if (is_mp4 === true) {
          this.e.reply(segment.video(`${_path}/plugins/example/douyin.mp4`));
          logger.info('使用了 douyin.wtf API ，无法提供' + logger.yellow('评论') + '与' + logger.yellow('小红书') + '解析')
        }
        return
      }
    } catch (err) {
      this.e.reply('任务执行报错\n' + err)
      return
    }
    if (code === 2) {
      try {
        await this.v2_dy_data(dydata)
        if (is_mp4 === true) {
          this.e.reply(segment.video(`${_path}/plugins/example/douyin.mp4`));
          logger.info('使用了 TikHub API 提供的解析服务')
        }
        return true
      } catch (err) {
        this.e.reply('任务执行报错\n' + err)
        return
      }
    }
  }

  /**
   * 
   * @param {*} dydata 传入视频json
   */
  async v1_dy_data(dydata) {
    this.e.gid = this.e.group_id
    let v1data = dydata.data
    let full_data = [] //总数组
    //这里获取图集信息-------------------------------------------------------------------------------------------------------------
    let image_res = []
    if (v1data.aweme_list[0].img_bitrate !== null) {
      let image_data = []
      let imageres = []
      for (let i = 0; i < v1data.aweme_list[0].img_bitrate[1].images.length; i++) {
        let image_url = v1data.aweme_list[0].img_bitrate[1].images[i].url_list[2] //图片地址
        imageres.push(segment.image(image_url))
      }
      let dsc = '解析完的图集图片'
      let res = await common.makeForwardMsg(this.e, imageres, dsc)
      image_data.push(res)
      image_res.push(image_data)
    } else {
      image_res.push('此作品不是图集噢~')
    }
    //这里判断是否使用剪映模板制作(先搁置，有bug还没想到怎么修)---------------------------------------------------------------------------------------------------------
    let jianying_res = []
    //if (v1data.aweme_list[0].anchor_info) {
    //  let jianying_data = []
    //  let jianyingres = []
    //  let parse = v1data.aweme_list[0].anchor_info.extra;
    //  parse = parse.replace(/\\/g, '');
    //  let jydata = JSON.parse(parse);
    //  if(jydata.anchor.name) {}
    //  let name = jydata.anchor.name
    //  let url = jydata.anchor.url
    //  let get_jy_data = (`这条视频使用剪映模板\n"${name}" 制作\n模板链接:\n${url}`)
    //  jianyingres.push(get_jy_data)
    //  let dsc = `剪映模板名称：${name}`
    //  let res = await common.makeForwardMsg(this.e, jianyingres, dsc)
    //  jianying_data.push(res)
    //  jianying_res.push(jianying_data)
    //} else {
    //  jianying_res.push('未发现使用剪映模板制作')
    //}
    //这里获取创作者信息------------------------------------------------------------------------------------------------------------
    let author_res = []
    if (v1data.aweme_list[0].author) {
      let author_data = []
      let authorres = []
      const author = v1data.aweme_list[0].author
      let sc = await this.count(author.favoriting_count) //收藏
      let gz = await this.count(author.follower_count) //关注
      let id = author.nickname //id
      let jj = author.signature //简介
      let age = author.user_age //年龄
      let sczs = author.total_favorited
      authorres.push(`创作者名称：${id}`)
      authorres.push(`创作者：${id}拥有${gz}个粉丝，${sc}个收藏和${sczs}个收藏总数`)
      authorres.push(`${id}今年${age}岁，Ta的简介是：\n${jj}`)
      let dsc = '创作者信息'
      let res = await common.makeForwardMsg(this.e, authorres, dsc)
      author_data.push(res)
      author_res.push(author_data)
    }
    //这里获取BGM信息------------------------------------------------------------------------------------------------------------
    let music_res = []
    if (v1data.aweme_list[0].music) {
      let music_data = []
      let musicres = []
      const music = v1data.aweme_list[0].music
      let music_id = music.author //BGM名字
      let music_img = music.cover_hd.url_list[0] //BGM作者头像
      let music_url = music.play_url.uri //BGM link
      musicres.push(`BGM名字：${music_id}`)
      musicres.push(`BGM下载直链：${music_url}`)
      musicres.push(`BGM作者头像\n${music_img}`)
      let dsc = 'BGM相关信息'
      let res = await common.makeForwardMsg(this.e, musicres, dsc)
      music_data.push(res)
      music_res.push(music_data)
      if (v1data.aweme_list[0].img_bitrate !== null) {
        this.e.reply(await uploadRecord(music_url, 0, false))
      }
    }
    //这里是ocr识别信息-----------------------------------------------------------------------------------------------------------
    let ocr_res = []
    if (v1data.aweme_list[0].seo_info.ocr_content) {
      let ocr_data = []
      let ocrres = []
      let text = v1data.aweme_list[0].seo_info.ocr_content
      ocrres.push('说明：\norc可以识别视频中可能出现的文字信息')
      ocrres.push(text)
      let dsc = 'ocr视频信息识别'
      let res = await common.makeForwardMsg(this.e, ocrres, dsc)
      ocr_data.push(res)
      ocr_res.push(ocr_data)
    } else {
      ocr_res.push('视频或图集中未发现可供ocr识别的文字信息')
    }
    //这里是获取视频信息------------------------------------------------------------------------------------------------------------
    let video_res = []
    if (v1data.aweme_list[0].video.play_addr_h264) {
      let video_data = []
      let videores = []
      const video = v1data.aweme_list[0].video
      let FPS = video.bit_rate[0].FPS //FPS
      let video_url = video.play_addr_h264.url_list[2] //video link
      let cover = video.origin_cover.url_list[0] //video cover image
      let title = v1data.aweme_list[0].preview_title //video title
      videores.push(`标题：\n${title}`)
      videores.push(`视频帧率：${"" + FPS}`)
      videores.push(`等不及视频上传可以先看这个，视频直链：\n${video_url}`)
      videores.push(segment.image(cover))
      let dsc = '视频基本信息'
      let res = await common.makeForwardMsg(this.e, videores, dsc)
      video_data.push(res)
      video_res.push(video_data)
      let qiy = {
        "Server": "CWAP-waf",
        "Content-Type": "video/mp4",
      }
      let mp4 = await fetch(`${video.play_addr_h264.url_list[2]}`, { method: "GET", headers: qiy });
      let a = await mp4.buffer();
      let path = `${_path}/plugins/example/douyin.mp4`;
      fs.writeFile(path, a, "binary", function (err) {
        if (!err) {
          //this.e.sendMsg(segment.video(path))
          console.log("视频下载成功");
        }
        return false
      })
    }
    let res = full_data.concat(video_res).concat(image_res).concat(music_res).concat(author_res).concat(ocr_res)
    this.e.reply(await common.makeForwardMsg(this.e, res, '抖音'))
  }

  /**
   * 
   * @param {*} dydata 传入视频json
   */
  async v2_dy_data(dydata) {
    this.e.gid = this.e.group_id
    let v2data = dydata.data
    // 先把评论数据抽出来------------------------------------------------------------------------------------------------------------------------------------------------------
    let pl_data = []
    if (dydata.comments && dydata.comments.comments_list) {
      let comments_list = dydata.comments.comments_list.slice(0, 15);
      let video_dz = []
      for (let i = 0; i < comments_list.length; i++) {
        let text = comments_list[i].text;
        let ip = comments_list[i].ip_label;
        let digg_count = comments_list[i].digg_count;
        if (digg_count > 10000) {
          digg_count = (digg_count / 10000).toFixed(1) + "w"
        }
        video_dz.push(`${text} \nip：${ip}            ♥${digg_count}`);
      }
      let dz_text = video_dz.join("\n\n\n")
      pl_data.push(`🔥热门评论🔥\n${dz_text}`)
    } else {
      pl_data.push("评论数据获取失败")
    }
    //提取图集数据------------------------------------------------------------------------------------------------------------------------------------------------------
    if (v2data.aweme_list[0].video.bit_rate.length === 0) {
      let res = []
      if (v2data.aweme_list[0].images[0].url_list[0] === undefined) {
        e.reply("请求错误，请再试一次...")
        return
      }
      //定位标题
      let bt = v2data.aweme_list[0].desc
      //作者头像
      let tx = v2data.aweme_list[0].author.avatar_thumb.url_list[0]
      //作者名称
      let name = v2data.aweme_list[0].author.nickname
      //BGM名字
      let BGMname = v2data.aweme_list[0].music.title
      //视频点赞、评论、分享、收藏
      let dz = await this.count(v2data.aweme_list[0].statistics.digg_count)
      let pl = await this.count(v2data.aweme_list[0].statistics.comment_count)
      let fx = await this.count(v2data.aweme_list[0].statistics.share_count)
      let sc = await this.count(v2data.aweme_list[0].statistics.collect_count)
      let xmltitle = (`该图集被点赞了${dz}次，拥有${pl}条评论，被分享了${fx}次`)
      //抖音号
      let dyid;
      if (v2data.aweme_list[0].author.unique_id === "") {
        if (v2data.aweme_list[0].author.short_id === "") {
          dyid = "找不到他/她的抖音ID"
        } else {
          dyid = v2data.aweme_list[0].author.short_id;
        }
      } else {
        dyid = v2data.aweme_list[0].author.unique_id;
      }
      //BGM直链
      let music = v2data.aweme_list[0].music.play_url.uri
      let cause = v2data.aweme_list[0].music.offline_desc
      let imagenum = 0 //记录图片数量
      //遍历图片数量
      let imgarr = []
      for (let i = 0; i < v2data.aweme_list.length; i++) {
        let aweme_list = v2data.aweme_list[i];
        for (let j = 0; j < aweme_list.images.length; j++) {
          //图片链接
          let image_url = aweme_list.images[j].url_list[0];
          imgarr.push(segment.image(image_url));
          imagenum++
          if (imagenum >= 100) { //数量达到100跳出循环
            break
          }
        }
        if (imagenum >= 100) { //数量达到100跳出循环
          break
        }
      }
      if (imagenum === 100) {
        let msg = await this.makeForwardMsg(this.e.user_id, "抖音", xmltitle, res)
        await this.e.reply(msg)
      } else if (imagenum === 1) {
        let lbw = []
        let image_url = v2data.aweme_list[0].images[0].url_list[0];
        let lbwtitle = [`抖音号：${dyid}【${name}的图文作品】`, `图集标题：${bt}`]
        //let lbwbody = pl_data
        let lbwtial = (`BGM：${BGMname}\nBGM地址：${music}${cause}`)
        let pldata = []
        pldata.push(pl_data)
        let forpldata = await common.makeForwardMsg(this.e, pldata, '热门评论')
        this.e.reply(segment.image(image_url))
        lbw.push(lbwtitle)
        lbw.push(forpldata)
        lbw.push(lbwtial)
        await this.e.reply(await this.makeForwardMsg(this.e.user_id, "抖音", xmltitle, lbw))
      }
      else {
        //先合并转发一次评论数据
        let image_pldata = []
        image_pldata.push(pl_data)
        let image_forpldata = await common.makeForwardMsg(this.e, image_pldata, '热门评论')

        //处理字符串(如果图鸡不是100张)
        let textarr = [`抖音号：${dyid}【${name}的图文作品】`, `图集标题：${bt}`]
        //concat重新排列
        let resarr = textarr.concat(imgarr).concat(image_forpldata).concat(`BGM：${BGMname}\nBGM地址：${music}${cause}`)
        //logger.mark(resarr)
        //制作合并转发消息
        let msg = await this.makeForwardMsg(this.e.user_id, "抖音", xmltitle, resarr)
        await this.e.reply(msg)
      }
      //如果音频直链为空
      if (!music) {
        this.e.reply(`无法上传，原因：${cause}`, false)
        return
      } else {
        //发送高清语音
        console.log(`音频直链${music}${cause}`)
        this.e.reply(await uploadRecord(music, 0, false))
      }
    }
    //获取视频数据---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    else {
      let qiy = {
        "Server": "CWAP-waf",
        "Content-Type": "video/mp4",
      }
      let mp4 = await fetch(`${v2data.aweme_list[0].video.bit_rate[0].play_addr.url_list[2]}`, { method: "get", headers: qiy });
      let res2 = []
      let basic = "Successfully processed, please wait for video upload"
      //标题
      let bt = v2data.aweme_list[0].desc
      //抖音头像
      let tx = v2data.aweme_list[0].author.avatar_thumb.url_list[0]
      //作者名称
      let name = v2data.aweme_list[0].author.nickname
      //BGM名字
      let BGMname = v2data.aweme_list[0].music.title
      //抖音号
      //let dyid = v2data.author.unique_id
      let dyid;
      if (v2data.aweme_list[0].author.unique_id === "") {
        if (v2data.aweme_list[0].author.short_id === "") {
          dyid = "找不到他/她的抖音ID"
        } else {
          dyid = v2data.aweme_list[0].author.short_id;
        }
      } else {
        dyid = v2data.aweme_list[0].author.unique_id;
      }
      //视频点赞、评论、分享、收藏
      let dz = await this.count(v2data.aweme_list[0].statistics.digg_count)
      let pl = await this.count(v2data.aweme_list[0].statistics.comment_count)
      let fx = await this.count(v2data.aweme_list[0].statistics.share_count)
      let sc = await this.count(v2data.aweme_list[0].statistics.collect_count)
      let xmltitle = (`该被点赞了${dz}次，拥有${pl}条评论，被分享了${fx}次`)
      //BGM地址
      let music = v2data.aweme_list[0].music.play_url.uri
      let cause = v2data.aweme_list[0].music.offline_desc
      //视频封面
      //let cover = v2data.cover_data.dynamic_cover.url_list[0]
      //视频直链
      let video = v2data.aweme_list[0].video.bit_rate[0].play_addr.url_list[2]
      //处理基本信息
      res2.push(basic)
      res2.push(`抖音号：${dyid}【${name}的视频作品】`)
      res2.push(`视频标题：${bt}`)
      res2.push(`要是等不及视频上传，可以先看看这个 👇${video}`)
      //处理评论数据(所有评论数据合并成一个字符串先)
      let video_pldata = []
      if (dydata.comments && dydata.comments.comments_list) {
        let comments_list = dydata.comments.comments_list.slice(0, 80);
        let video_dz = []
        for (let i = 0; i < comments_list.length; i++) {
          let text = comments_list[i].text;
          let ip = comments_list[i].ip_label;
          let digg_count = comments_list[i].digg_count;
          digg_count = this.count(digg_count)
          video_dz.push(`${text} \nip：${ip}            ♥${digg_count}`);
        }
        let dz_text = video_dz.join("\n\n\n")
        video_pldata.push(`🔥热门评论🔥\n${dz_text}`)
      } else {
        video_pldata.push("评论数据获取失败")
      }
      //来到这先转发一次评论数据，然后再套娃到最终的合并转发消息中去
      //一个新的字符串，用来转发评论数据(pldata)
      let video_forpldata = []
      video_forpldata.push(video_pldata)
      //合并转发
      let video_forwardmsg_pldata = await common.makeForwardMsg(this.e, pl_data, '热门评论')
      //然后再合并到res2字符串中等待再次转发(套娃)
      res2.push(video_forwardmsg_pldata)
      res2.push(`BGM：${BGMname}\nBGM地址：${music}${cause}`)
      //res2.push(`视频封面：${cover}`)
      //logger.mark(res2)
      let video_data = await this.makeForwardMsg(this.e.user_id, "抖音", xmltitle, res2)
      await this.e.reply(video_data)
      console.log("视频直链：", video)
      let a = await mp4.buffer();
      let path = `${_path}/plugins/example/douyin.mp4`;
      fs.writeFile(path, a, "binary", function (err) {
        if (!err) {
          //this.e.reply(segment.video(path));
          logger.info("视频下载成功");
        }
        return false
      })
    }


  }

  /**
   * 
   * @param {*} url 提取后的链接
   * @returns 
   */
  async douyin(url) {
    let api_v1 = `https://api.douyin.wtf/douyin_video_data/?douyin_video_url=${url}`
    if(AccountFile.address) {
      api_v1 = `http://${AccountFile.address}/douyin_video_data/?douyin_video_url=${url}`
    }
    const api_v2 = `https://api.tikhub.io/douyin/video_data/?douyin_video_url=${url}&language=zh`
    const comment_v2 = `https://api.tikhub.io/douyin/video_comments/?douyin_video_url=${url}&cursor=0&count=50&language=zh`
    let result = { tik_status: 0 };
    try {
      let headers = { "accept": "application/json", "Authorization": `Bearer ${AccountFile.access_token}` }
      let api_v2_json = await fetch(api_v2, { method: 'GET', headers: headers })
      let data_v2_json = await api_v2_json.json()
      if (data_v2_json.status === false) {
        logger.warn(`使用 TikHub API 时${data_v2_json.detail.message}，可前往 https://dash.tikhub.io/pricing 购买额外请求次数或者注册新的TikHbu账号（理论上可以一直白嫖）`)
        throw new Error('TikHub API 请求成功但返回错误，将使用 douyin.wtf API 再次请求')
      } else {
        try {
          let comments_data = await fetch(comment_v2, { method: "GET", headers: headers })
          let comments = await comments_data.json()
          result.comments = comments
        } catch (err) {
          logger.error(`请求 TikHub API 获取评论数据出错：${err}`)
          result.comments = false
        }
        if (data_v2_json.aweme_list[0].video.play_addr_h264 !== undefined) {
          result.is_mp4 = true
        } else result.is_mp4 = false
        result.data = data_v2_json;
        result.tik_status = 2;
        logger.info(JSON.stringify(result))
        return result;
      }
    } catch (err) {
      logger.error(`TikHub API 请求失败\n${err}`);
      logger.info(`开始请求备用接口：${api_v1}`)
      try {
        let api_v1_josn = await fetch(api_v1, { method: 'GET', headers: { "accept": "application/json", "Content-type": "application/x-www-form-urlencoded", } })
        let data_v1_json = await api_v1_josn.json()
        result.data = data_v1_json;
        if (data_v1_json.aweme_list[0].images === null) {
          result.is_mp4 = true
        }
        result.tik_status = 1;
      } catch (err) {
        console.log(`use douyin.wtf API: ${err}`)
        let startTime = Date.now();
        do {
          try {
            let api_v1_josn = await fetch(api_v1, { method: 'GET', headers: { "accept": "application/json", "Content-type": "application/x-www-form-urlencoded", } })
            let data_v1_json = await api_v1_josn.json()
            result.data = data_v1_json;
            if (data_v1_json.aweme_list[0].images === null) {
              result.is_mp4 = true
            }
            result.tik_status = 1;
          } catch (err) {
            if (Date.now() - startTime > 30000) {
              logger.error('30秒内 douyin.wtf API 连续请求失败，任务结束');
              this.e.reply('任务执行报错\n' + err)
              break;
            }
          }
        } while (true);
      }
    }
    //logger.warn(JSON.stringify(result))
    return result
  }



  async gettoken() {
    let headers = {
      "accept": "application/json",
      "Content-type": "application/x-www-form-urlencoded",
    }
    let body = `grant_type=&username=${username}&password=${password}&scope=&client_id=&client_secret=`
    let vdata = await fetch(`https://api.tikhub.io/user/login?token_expiry_minutes=525600&keep_login=true`, {
      method: "POST",
      headers,
      body
    })
    //返回账号token
    let tokendata = await vdata.json();
    //logger.mark(tokendata)
    let accountfile = `${_path}/plugins/kkkkkk-10086/config/config.json`;
    let doc = JSON.parse(fs.readFileSync(accountfile, 'utf8'));
    // 将获取到的 access_token 写入 doc 对象，并写回到文件中
    doc.access_token = tokendata.access_token;
    fs.writeFileSync(accountfile, JSON.stringify(doc, null, 2), 'utf8')
    await this.getnumber()
    return ('刷新token成功，该token拥有365天有效期')
  }
  async getnumber() {
    let access_token = AccountFile.access_token;
    let headers2 = {
      "accept": "application/json",
      "Authorization": `Bearer ${access_token}`,
    }

    let noteday = await fetch(`https://api.tikhub.io/promotion/daily_check_in`, {
      method: "GET",
      headers: headers2
    });
    let notedayjson = await noteday.json();
    await fetch(`https://api.tikhub.io/promotion/claim?promotion_id=1`, {
      method: "GET",
      headers: headers2
    })
    //logger.mark(notedayjson);
    if (notedayjson.status === true) {
      console.log(notedayjson.status)
      return (`刷新token成功，${notedayjson.message}`)
    } else if (notedayjson.message === '每24小时只能签到一次/You can only check in once every 24 hours') {
      console.log('账号24小时内不可多次签到\n' + notedayjson.message)
      return ('账号24小时内不可多次签到\n' + notedayjson.message)
    }
  }
  /**
  * 
  * @param {*} qq icqq信息
  * @param {*} firsttitle 解析平台：抖音? 快手? 小红书? Tik Tok?
  * @param {*} title xml标题
  * @param {*} msg 发送的内容
  * @returns 
  */
  async makeForwardMsg(qq, firsttitle, title, msg = []) {
    let nickname = Bot.nickname
    if (this.e.isGroup) {
      let info = await Bot.getGroupMemberInfo(this.e.group_id, qq)
      nickname = info.card ?? info.nickname
    }
    let userInfo = {
      user_id: this.e.user_id,
      nickname: this.e.sender.card || this.e.user_id,
    }

    let forwardMsg = []
    msg.forEach(v => {
      forwardMsg.push({
        ...userInfo,
        message: v
      })
    })

    /** 制作转发内容 */
    if (this.e.isGroup) {
      forwardMsg = await this.e.group.makeForwardMsg(forwardMsg)
    } else {
      forwardMsg = await this.e.friend.makeForwardMsg(forwardMsg)
    }

    /** 处理描述 */
    forwardMsg.data = forwardMsg.data
      .replace(/\n/g, '')
      .replace(/<?xml version="1.0" encoding="utf-8"?>/g, '___')
      .replace(/___+/, `<?xml version='1.0' encoding='UTF-8' standalone="yes"?>`)
      .replace(/<title color="#000000" size="34">转发的聊天记录<\/title>/g, '___')
      .replace(/___+/, `<title color="#000000" size="34">解析平台：${firsttitle}<\/title>`)
      .replace(/<title color="#777777" size="26">(.+?)<\/title>/g, '___')
      .replace(/___+/, `<title color="#777777" size="26">${title}</title>`)
      .replace(/<summary color="#808080" size="26">/g, '___')
      .replace(/___+/, `<summary color="#808080">`)
      .replace(/<source name="聊天记录">/g, '___')
      .replace(/___+/, `<source name="解析平台：${firsttitle}">`)

    return forwardMsg
  }

}

