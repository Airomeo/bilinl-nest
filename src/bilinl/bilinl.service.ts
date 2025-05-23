import { HttpService } from '@nestjs/axios';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Queue } from 'bullmq';
import dayjs from 'dayjs';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';

interface CallbackPayload {
  type: number;
  [key: string]: any;
}

// 后续如果有调整，务必保证index顺序，因为后面是直接通过index获取tag
const targetEnterpriseTags = [
  {
    opTagId: '1654755551412850688__1911426519781654528',
    tagId: '1911426519781654528',
    tagName: '销售主动覆盖0次',
    userNum: null,
  },
  {
    opTagId: '1654755551412850688__1911426519781654529',
    tagId: '1911426519781654529',
    tagName: '销售主动覆盖1次',
    userNum: null,
  },
  {
    opTagId: '1654755551412850688__1911426519781654530',
    tagId: '1911426519781654530',
    tagName: '销售主动覆盖2次',
    userNum: null,
  },
  {
    opTagId: '1654755551412850688__1911426519781654531',
    tagId: '1911426519781654531',
    tagName: '销售主动覆盖3次',
    userNum: null,
  },
  {
    opTagId: '1654755551412850688__1911426519781654532',
    tagId: '1911426519781654532',
    tagName: '销售主动覆盖4次',
    userNum: null,
  },
  {
    opTagId: '1654755551412850688__1911426519781654533',
    tagId: '1911426519781654533',
    tagName: '销售主动覆盖5次',
    userNum: null,
  },
  {
    opTagId: '1654755551412850688__1911426519781654534',
    tagId: '1911426519781654534',
    tagName: '销售主动覆盖6次',
    userNum: null,
  },
  {
    opTagId: '1654755551412850688__1911426519781654535',
    tagId: '1911426519781654535',
    tagName: '销售主动覆盖7次',
    userNum: null,
  },
  {
    opTagId: '1654755551412850688__1911426519781654536',
    tagId: '1911426519781654536',
    tagName: '销售主动覆盖8次',
    userNum: null,
  },
  {
    opTagId: '1654755551412850688__1911426519781654537',
    tagId: '1911426519781654537',
    tagName: '销售主动覆盖9次',
    userNum: null,
  },
  {
    opTagId: '1654755551412850688__1911426519781654538',
    tagId: '1911426519781654538',
    tagName: '销售主动覆盖10次',
    userNum: null,
  },
  {
    opTagId: '1654755551412850688__1911426519781654539',
    tagId: '1911426519781654539',
    tagName: '销售主动覆盖11次',
    userNum: null,
  },
  {
    opTagId: '1654755551412850688__1911426519781654540',
    tagId: '1911426519781654540',
    tagName: '销售主动覆盖12次',
    userNum: null,
  },
  {
    opTagId: '1654755551412850688__1912706032302493696',
    tagId: '1912706032302493696',
    tagName: '销售主动覆盖12次以上',
    userNum: null,
  },
];
const configTemplates: {
  taskName: string;
  taskDelay: {
    add: { value: number; unit: string };
    hour: number;
    minute: number;
  };
  addTags: {
    opTagId?: string;
    tagId: string;
    tagName?: string;
    userNum?: null;
  }[];
  deleteTags: {
    opTagId?: string;
    tagId: string;
    tagName?: string;
    userNum?: null;
  }[];
  message: string;
}[] = [
  {
    taskName: '加V后',
    taskDelay: {
      add: { value: 0, unit: 'minute' },
      hour: 0,
      minute: 0,
    },
    addTags: targetEnterpriseTags.filter((_, index) => index === 0),
    deleteTags: targetEnterpriseTags.filter((_, index) => index !== 0),
    message: ``,
  },
  {
    taskName: '加V后5分钟',
    taskDelay: {
      add: { value: 5, unit: 'minute' },
      hour: 0,
      minute: 0,
    },
    addTags: targetEnterpriseTags.filter((_, index) => index === 1),
    deleteTags: targetEnterpriseTags.filter((_, index) => index !== 1),
    message: `你好，我是京东大药房药师，你之前在京东买了哪些药？效果如何？现在京东部分药品推出疗效险，用药无效在一定时间段内可以申请赔付，你这边给我说下，我帮你查询下`,
  },
  {
    taskName: '加V后4小时',
    taskDelay: {
      add: { value: 4, unit: 'hour' },
      hour: 0,
      minute: 0,
    },
    addTags: targetEnterpriseTags.filter((_, index) => index === 2),
    deleteTags: targetEnterpriseTags.filter((_, index) => index !== 2),
    message: `你好，这里是【京东大药房男科咨询室】，本人擅长中西结合用药治疗，有以下情况需求吗？（回复数字即可）
【1】前列腺
【2】提升房事硬度，时间
【3】房事助兴
【4】备孕，调理身体
【5】其他
我们的全程对话都将保密。`,
  },
  {
    taskName: '加V后第2天早上10:00',
    taskDelay: {
      add: { value: 1, unit: 'day' },
      hour: 10,
      minute: 0,
    },
    addTags: targetEnterpriseTags.filter((_, index) => index === 3),
    deleteTags: targetEnterpriseTags.filter((_, index) => index !== 3),
    message: `你好，我是你的男科健康指导师，男性问题不建议自己胡乱搭配药物使用伤害身体，我会根据你的情况给出专业的建议，收到信息请回复一下`,
  },
  {
    taskName: '加V后第2天晚上18:00',
    taskDelay: {
      add: { value: 1, unit: 'day' },
      hour: 18,
      minute: 0,
    },
    addTags: targetEnterpriseTags.filter((_, index) => index === 4),
    deleteTags: targetEnterpriseTags.filter((_, index) => index !== 4),
    message: `你在京东买的什么药？现在是什么症状？可以给我说下，以免你自己用错药伤害身体。`,
  },
  {
    taskName: '加V后第3天早上10:00',
    taskDelay: {
      add: { value: 2, unit: 'day' },
      hour: 10,
      minute: 0,
    },
    addTags: targetEnterpriseTags.filter((_, index) => index === 5),
    deleteTags: targetEnterpriseTags.filter((_, index) => index !== 5),
    message: `还在为房事不行而困扰吗？还在靠药物维持性生活吗？回复1，我帮你解决，摆脱药物，重振雄风[抱拳]`,
  },
  {
    taskName: '加V后第3天晚上18:00',
    taskDelay: {
      add: { value: 2, unit: 'day' },
      hour: 18,
      minute: 0,
    },
    addTags: targetEnterpriseTags.filter((_, index) => index === 6),
    deleteTags: targetEnterpriseTags.filter((_, index) => index !== 6),
    message: `目前房事还满意吗，有提升房事能力或者了解房事技巧的想法吗，回复【提升】或者【技巧】给你详细解答`,
  },
  {
    taskName: '加V后第10天中午14:00',
    taskDelay: {
      add: { value: 9, unit: 'day' },
      hour: 14,
      minute: 0,
    },
    addTags: targetEnterpriseTags.filter((_, index) => index === 7),
    deleteTags: targetEnterpriseTags.filter((_, index) => index !== 7),
    message: `你好，我是你的男性健康指导师，男性问题不建议自己胡乱搭配药物使用伤害身体，我会根据你的情况给出专业的建议，收到信息请回复一下`,
  },
  {
    taskName: '加V后第17天中午14:00',
    taskDelay: {
      add: { value: 16, unit: 'day' },
      hour: 14,
      minute: 0,
    },
    addTags: targetEnterpriseTags.filter((_, index) => index === 8),
    deleteTags: targetEnterpriseTags.filter((_, index) => index !== 8),
    message: `你可以不回导师的信息，不为后半辈子操心，咱们做男人的性福就是来源于现在的努力，当初既然选择跟着导师的步伐治疗，导师也希望你跟到底，正所谓用人不疑 疑人不用，你实在是有什么顾虑，就是觉得贵，你给我说，导师给你想办法，导师能帮你的一定帮到底，但是你不能这样不巩固，知道吗？我们一起商量，贵有贵的对策，但是你不能放弃这最后一步`,
  },
  {
    taskName: '加V后第24天中午14:00',
    taskDelay: {
      add: { value: 23, unit: 'day' },
      hour: 14,
      minute: 0,
    },
    addTags: targetEnterpriseTags.filter((_, index) => index === 9),
    deleteTags: targetEnterpriseTags.filter((_, index) => index !== 9),
    message: `这是我的一个患者反馈的，跟上导师的一个疗程下来已经达到满意的程度了，我相信你也会跟他一样，重整雄风，不受男性问题的困扰，身体健康，精气神十足，人也自信了许多`,
  },
  {
    taskName: '加V后第31天中午14:00',
    taskDelay: {
      add: { value: 30, unit: 'day' },
      hour: 14,
      minute: 0,
    },
    addTags: targetEnterpriseTags.filter((_, index) => index === 10),
    deleteTags: targetEnterpriseTags.filter((_, index) => index !== 10),
    message: `不知道你还记得当初加我的初衷吗？明确的告诉您。男性问题拖一天 问题严重一点。拖一年 治疗难度就有可能高三层，说句实话 你不治疗对我也没有什么影响，之所以和您说这么多 是因为不想眼睁睁的看着你越拖越严重。`,
  },
  {
    taskName: '加V后第38天中午14:00',
    taskDelay: {
      add: { value: 37, unit: 'day' },
      hour: 14,
      minute: 0,
    },
    addTags: targetEnterpriseTags.filter((_, index) => index === 11),
    deleteTags: targetEnterpriseTags.filter((_, index) => index !== 11),
    message: `"用户李先生反馈：‘医师搭配的中西组合，1个月后时间延长了！
🔍 您需要了解具体用法吗？回复【方案】针对性的沟通💊"`,
  },
  {
    taskName: '加V后第45天中午14:00',
    taskDelay: {
      add: { value: 44, unit: 'day' },
      hour: 14,
      minute: 0,
    },
    addTags: targetEnterpriseTags.filter((_, index) => index === 12),
    deleteTags: targetEnterpriseTags.filter((_, index) => index !== 12),
    message: `"患者感谢：‘早泄调理后，和爱人关系缓和多了！
🌿 您是否需要帮助升温？可详细咨询，找老师领取「伴侣沟通指南」❤️"`,
  },
  {
    taskName: '加V后第52天中午14:00',
    taskDelay: {
      add: { value: 51, unit: 'day' },
      hour: 14,
      minute: 0,
    },
    addTags: targetEnterpriseTags.filter((_, index) => index === 13),
    deleteTags: targetEnterpriseTags.filter((_, index) => index !== 13),
    message: `"""患者评价：坚持3个月科学调理，现在状态明显改善！
👉 您是否想了解周期计划？回复【1】开始详细咨询针对性的制定周期计划🌟"""`,
  },
  {
    taskName: '加V后第59天中午14:00',
    taskDelay: {
      add: { value: 58, unit: 'day' },
      hour: 14,
      minute: 0,
    },
    addTags: [],
    deleteTags: [],
    message: `患者3个疗程治疗后反馈：按周期用药+定期复查，现在基本稳定了`,
  },
  {
    taskName: '加V后第66天中午14:00',
    taskDelay: {
      add: { value: 65, unit: 'day' },
      hour: 14,
      minute: 0,
    },
    addTags: [],
    deleteTags: [],
    message: `"{昵称}你好，分享给你#事前冷知识
一张图了解👉男人和女人身体的敏感点和敏感指数，下次前戏知道该挑逗哪些地方了吧😎
想要咨询和提升房事时间和勃起硬度吗？"`,
  },
  {
    taskName: '加V后第73天中午14:00',
    taskDelay: {
      add: { value: 72, unit: 'day' },
      hour: 14,
      minute: 0,
    },
    addTags: [],
    deleteTags: [],
    message: `"有的同学觉得一些所谓的常识或者偏方可以延长房事时间，但不通过科学的调理，是很难的，甚至对身体有一定伤害。

想要科学提升房事时间和勃起硬度吗？可直接回复咨询"`,
  },
];

@Injectable()
export class BilinlService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BilinlService.name);

  // 映射表（业务逻辑分发）
  // 处理不同类型的回调
  // 100001 企业微信修改机器人
  // 100004 获取机器人名片信息
  // 100005 机器人主动退出企业
  // 200006 新好友请求回调接口
  // 200008 机器人被加好友回调
  // 200011 删除客户好友结果
  // 200012 修改好友备注回调
  // 300002 企业微信修改群名称
  // 300003 企微获取群二维码
  // 300004 企业微信群主动退群
  // 300005 群内发布公告回调
  // 300006 企业微信群转让群主
  // 300008 群内踢人回调
  // 300009 机器邀请好友入群
  // 300013 设置群内昵称回调
  // 300014 获取群公告回调
  // 300016 设置管理员回调
  // 300019 机器人退群取消关注
  // 300022 机器人好友邀请入群
  // 300024 机器人被移出群聊
  // 300029 新成员入群回调
  // 300030 群成员退群回调
  // 300034 群信息变动回调
  // 400002 私聊发信息结果回调
  // 400003 群聊消息发送结果
  // 400005 接收客户私聊信息
  // 400006 接收群内实时消息
  // 400007 商家下载消息文件
  // 400008 已发送消息的撤回
  // 702005 设置好友标签异步
  // 902500002登录成功回调
  // 902500005退出登录回调
  // 401002企微发送朋友圈回调
  // 401003删除朋友圈回调
  // 705014企微转发视频号消息
  // 905050客户私聊消息(封面)
  // 500002企微登录成功回调
  // 扫码登录需要验证码701092
  // 701039受限通知
  // 离/在职好友继承回调703066
  // 在职继承接替结果回调703072
  // 905051群消息回调(封面)
  // 705022接收客服消息回调
  callbackHandlers = {
    200008: (body) => this.handle200008(body),
    400005: (body) => this.handle400005(body),
    905050: (body) => this.handle905050(body),
    // 📝 可以继续添加更多映射项
  };

  constructor(
    private readonly httpService: HttpService,
    @InjectQueue('bilinl') private bilinlQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async onApplicationBootstrap() {
    // const job = await this.bilinlQueue.add(
    //   'callback',
    //   {
    //     businessId: '',
    //     consumer: '',
    //     data: {
    //       base64_alias: '',
    //       base64_name: 'Tmljaw==',
    //       profile_photo:
    //         'http://wx.qlogo.cn/mmhead/ps68icnpRvDUTBsqvMDRnMZ0fj4FxBibUAkZF7RlFFoAiaWU0SOScibzGg/0',
    //       name: 'Nick',
    //       channel: '3.0',
    //       alias: '',
    //       add_time: '2025-05-11 13:52:36.000',
    //       contact_serial_no:
    //         'BAC9B503F15BA1C5365CFA0272FD2E315194F219CF554649F1C4F9C615435A82',
    //       add_by: -1,
    //       gender: 1,
    //     },
    //     extend: '',
    //     extendVersionOne: '',
    //     merchantId: '1654755551412850688',
    //     optSerNo: '20250511135247169630910114614',
    //     optUserId: '',
    //     originalParams: '',
    //     pushService: '',
    //     resultMsg: 'SUCCESS',
    //     robotId: '',
    //     serverName: 'neighbour-message',
    //     tgRobotId: '',
    //     timId: '',
    //     userId: '',
    //     vcMerchantNo: '202004240382704',
    //     version: 'v1',
    //     vrMerchatId: '',
    //     vrRobotId: '',
    //     wxId: 'B6DA44544B407789B0BEA81C0A3506675194F219CF554649F1C4F9C615435A82',
    //     pushTime: 1746942767196,
    //     resultCode: 1,
    //     type: 200008,
    //   },
    //   {
    //     delay: 5000,
    //     removeOnComplete: true,
    //     attempts: 3, // 可选重试
    //     backoff: {
    //       type: 'exponential', // 每次失败后，等待时间按指数级增长，0 2 4 8 16 32
    //       delay: 1000,
    //     },
    //   },
    // );
    // this.prisma.customer.count().then((count) => {
    //   this.logger.log(`User count: ${count}`);
    // });
    // const customers = await this.prisma.customer.findMany();
    // this.prisma.user
    //   .create({
    //     data: {
    //       email: 'email@c.cc',
    //       name: 'name',
    //     },
    //   })
    //   .then((user) => {
    //     this.logger.log(`User created: ${user.email}`);
    //   })
    //   .catch((error) => {
    //     this.logger.error(`Error creating user: ${error.message}`);
    //   });
    // setInterval(async () => {
    //   try {
    //     const response = await lastValueFrom(
    //       this.httpService.post(
    //         'https://gateway.bilinl.com/thirdparty/commonBusi/listMerchantSubAccount',
    //         {},
    //       ),
    //     );
    //     this.logger.log(response.data);
    //   } catch (error) {
    //     this.logger.error(error);
    //   }
    // }, 20000);
  }

  // 入队逻辑
  async enqueueCallback(body: CallbackPayload) {
    this.logger.log(`[Callback] Received body: ${JSON.stringify(body)}`);

    // 判断是否有 handler，决定是否入队
    if (!this.callbackHandlers[body.type]) {
      this.logger.warn(
        `[Callback] No handler registered for callback type ${body.type}`,
      );
      return;
    }

    return await this.bilinlQueue.add('callback', body, {
      removeOnComplete: true,
      attempts: 3, // 可选重试
      backoff: {
        type: 'exponential', // 每次失败后，等待时间按指数级增长，0 2 4 8 16 32
        delay: 1000,
      },
    });
  }

  // 处理逻辑入口
  async handleCallback(body: CallbackPayload): Promise<void> {
    const handler = this.callbackHandlers[body.type];
    if (!handler) {
      this.logger.warn(
        `[Callback] No handler registered for callback type ${body.type}`,
      );
      return;
    }

    try {
      await handler(body);
    } catch (error) {
      this.logger.error(
        `[Callback] Handler for type ${body.type} failed: ${error.message}`,
        error.stack,
      );

      throw error; // 交给 BullMQ 自动重试
    }
  }

  async handle200008(params: any) {
    // {
    //   "businessId": "",
    //   "consumer": "",
    //   "data": {
    //     "base64_alias": "",
    //     "base64_name": "Tmljaw==",
    //     "profile_photo": "http://wx.qlogo.cn/mmhead/ps68icnpRvDUTBsqvMDRnMZ0fj4FxBibUAkZF7RlFFoAiaWU0SOScibzGg/0",
    //     "name": "Nick",
    //     "channel": "3.0",
    //     "alias": "",
    //     "add_time": "2025-05-11 13:52:36.000",
    //     "contact_serial_no": "B60E27D17753E2C65CC2A7EEA8826CD45194F219CF554649F1C4F9C615435A82",
    //     "add_by": -1,
    //     "gender": 1
    //   },
    //   "extend": "",
    //   "extendVersionOne": "",
    //   "merchantId": "1654755551412850688",
    //   "optSerNo": "20250511135247169630910114614",
    //   "optUserId": "",
    //   "originalParams": "",
    //   "pushService": "",
    //   "resultMsg": "SUCCESS",
    //   "robotId": "",
    //   "serverName": "neighbour-message",
    //   "tgRobotId": "",
    //   "timId": "",
    //   "userId": "",
    //   "vcMerchantNo": "202004240382704",
    //   "version": "v1",
    //   "vrMerchatId": "",
    //   "vrRobotId": "",
    //   "wxId": "B6DA44544B407789B0BEA81C0A3506675194F219CF554649F1C4F9C615435A82",
    //   "pushTime": 1746942767196,
    //   "resultCode": 1,
    //   "type": 200008
    // }
    const freWxId: string = params.data.contact_serial_no;
    const wxId: string = params.wxId;

    try {
      // 保存好友信息到customer数据库表
      const customer = await this.prisma.customer.upsert({
        create: {
          ke_hu_ming_cheng: params.data.name,
          tian_jia_shi_jian: params.data.add_time,
          freWxId: freWxId,
          wxId: wxId,
          fu_gai_ci_shu: 0,
          kai_kou_zhuang_tai: false,
        },
        update: {
          ke_hu_ming_cheng: params.data.name,
          tian_jia_shi_jian: params.data.add_time,
          fu_gai_ci_shu: 0,
          kai_kou_zhuang_tai: false,
        },
        where: {
          wxId_freWxId: {
            freWxId: freWxId,
            wxId: wxId,
          },
        },
      });

      // 删标签
      await this.WithThrottleAndRetry(
        () =>
          this.thirdSetEnterFreTag({
            addTags: [],
            delTags: [
              '1910363962853605376', // 上月加V
              '1910363962853605376', // 过往加V
              '1911417568575152129', // 已开口
              ...targetEnterpriseTags.map((tag) => tag.tagId),
            ],
            freWxId: freWxId,
            merchatId: '',
            wxId: wxId,
          }),
        `${this.thirdSetEnterFreTag.name} ${freWxId} ${wxId}`,
      );

      // 打标签
      await this.WithThrottleAndRetry(
        () =>
          this.thirdSetEnterFreTag({
            addTags: [
              '1910363962891354112', // 当月加V
              '1911417568575152128', // 未开口
              '1911426519739711488', // 销售主动覆盖0次
            ],
            delTags: [],
            freWxId,
            merchatId: '',
            wxId,
          }),
        `${this.thirdSetEnterFreTag.name} ${freWxId} ${wxId}`,
      );

      // 添加下一次计划任务
      const configTemplate = configTemplates[customer.fu_gai_ci_shu!];
      await this.bilinlQueue.add(
        '覆盖次数计划任务',
        {
          freWxId,
          wxId,
          configTemplate,
        },
        {
          delay: dayjs(customer.tian_jia_shi_jian)
            .add(
              configTemplate.taskDelay.add.value,
              configTemplate.taskDelay.add.unit as dayjs.ManipulateType,
            )
            .hour(configTemplate.taskDelay.hour)
            .minute(configTemplate.taskDelay.minute)
            .diff(dayjs()),
          removeOnComplete: true,
          attempts: 3, // 可选重试
          backoff: {
            type: 'exponential', // 每次失败后，等待时间按指数级增长，0 2 4 8 16 32
            delay: 1000,
          },
        },
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  async handle400005(params: any) {
    // {
    //   "businessId": "",
    //   "consumer": "",
    //   "data": {
    //     "cover_url": "",
    //     "msg_serial_no": "",
    //     "msg_time": "2025-05-11 21:30:12",
    //     "title": "",
    //     "receiver_serial_no": "B6DA44544B407789B0BEA81C0A3506675194F219CF554649F1C4F9C615435A82",
    //     "sender_serial_no": "B60E27D17753E2C65CC2A7EEA8826CD45194F219CF554649F1C4F9C615435A82",
    //     "quote_content_base64": "eyJleHRyYV9kYXRhczIiOiJ7XCJFWFRSQV9DTE9DS1wiOm51bGwsXCJRVU9URV9NRVNTQUdFXCI6bnVsbCxcIk1FU1NBR0VfTElOS1wiOm51bGwsXCJTT1VSQ0VfQVBQXCI6bnVsbCxcIkVYVFJBX0lOVklURV9ST09NXCI6bnVsbCxcIk1TR19FTkNSWV9LRVlcIjpudWxsLFwiQVBQX0NPTlRST0xcIjpudWxsLFwiREVCVUdfSU5GT1wiOm51bGwsXCJFWFRSQV9NU0dJTUFHRU5BTUVcIjpudWxsLFwiRVhUUkFfSVNfQk9NQl9DT05cIjpmYWxzZSxcIk1TR19HUk9VUFwiOm51bGwsXCJBVFRBVENIRURfQ01EX01TR1wiOm51bGwsXCJhZGRfZmluYW5jZV90aXBzXCI6ZmFsc2UsXCJpc19maW5hbmNlX3hjeFwiOmZhbHNlLFwiaXNfbXNnX25vdF9hcHBlYXJcIjpmYWxzZSxcImlzX2F1ZGl0bXNnX3NlbmRfeGN4XCI6ZmFsc2UsXCJFWFRSQV9VU0VSX0lEX01BUFBJTkdcIjpudWxsLFwiaXNfcHVsbF9wcm9maWxlXCI6ZmFsc2UsXCJpc19uZWVkX3JlZnJlc2hfdG9rZW5cIjpmYWxzZSxcImZvcmNlX2FkZF91bnJlYWRfY250XCI6ZmFsc2UsXCJyb29taGlzdG9yeW1zZ1wiOm51bGwsXCJtYWtlX2FwcG9pbnRtZW50XCI6bnVsbCxcImlzX2JlZW5fc3BhbV9ibG9ja1wiOmZhbHNlLFwibm90X2FkZF91bnJlYWRfY291bnRcIjpmYWxzZSxcIndlYl9tc2dfaWRcIjowLFwid2ViX21zZ19yZWFkX2ZsYWdcIjowLFwicm9vbV9oaXN0b3J5X21zZ19yZXZva2VfZmxhZ1wiOjAsXCJ0ZXh0X21zZ191cmxfaW5mb1wiOm51bGwsXCJyZXZva2Vfcm9vbV9tc2dfYWRtaW5faW5mb1wiOm51bGwsXCJ0ZXh0X21zZ19kb2Nfc2hhcmVfY29kZV9pbmZvXCI6bnVsbCxcImlzX2NvbnRlbnRfbm90X2NoYW5nZVwiOmZhbHNlLFwia2ZfY2hhdF9zdGF0aXN0aWNcIjpudWxsLFwic2hhcmVfdHlwZVwiOjAsXCJpc19ub3RfcmVjZWl2ZV9mbGFnXCI6ZmFsc2UsXCJpc19pbnZpdGVfbW9yZV9wYXJlbnRfZmxhZ1wiOmZhbHNlLFwiaXNfaW52aXRlX3BhcmVudF9ieV9jcmVhdGVcIjpmYWxzZSxcImlzX3JlcGx5X21lXCI6ZmFsc2UsXCJpc19hdF9tZVwiOmZhbHNlLFwibGlua19tc2dfdHlwZVwiOjAsXCJpc19mb3J3YXJkX25vdGljZVwiOmZhbHNlLFwid3hfa2VmdV9tZW51X2xpc3RcIjpudWxsLFwiaXNfa2ZfbWVudV9tc2dcIjpmYWxzZSxcInRvX3dlYl9wcm90b19tZXNzYWdlXCI6bnVsbCxcIm1zZ19hdWRpdF9pbmZvXCI6bnVsbCxcImpzb25fc3RyaW5nXCI6bnVsbCxcImltdW5pb25fY29udGVudHR5cGVcIjowLFwiaW11bmlvbl9jb250ZW50YnVmZlwiOm51bGwsXCJhZGR0aW9uYWxfY29udGVudFwiOm51bGwsXCJzdHlsZV90ZXh0XCI6bnVsbCxcInNpZ25lZF9tc2dfZXh0cmFcIjpudWxsLFwiUlRYX0lORk9cIjpudWxsfSIsInJlY2FsbE1zZ0RldGFpbCI6bnVsbCwibXNnX2lkIjoxNDYzMDA4LCJzeW5jX2tleSI6ODAzMTA5NCwiY2hhbm5lbCI6MCwic3JjX3ZpZCI6Nzg4MTMwMTA4NDkxMTEwNSwiZHN0X3ZpZCI6MTY4ODg1NjA0MjU2ODk1MiwiZHN0X3Jvb21faWQiOjAsIm1zZ190eXBlIjoyLCJtc2dfY29udGVudCI6eyJtc2dfbGlzdCI6W3sic3ViX3R5cGUiOjAsImRhdGEiOnsiY29udGVudCI6IjQ0Q0M0NENDIiwiZXh0cmFfdGltZV9zdGFtcCI6MCwiY29kZV9sYW5ndWFnZSI6MH19XX0sImltYWdlX3VybCI6ImQzZDNlQT09IiwicmVhZHVpbnMiOltdLCJ1bnJlYWR1aW5zY291bnQiOjAsInNlbmR0aW1lIjoxNzQ2OTcwMjEyLCJmbGFnIjoxNjc3NzIxNiwiZGV2aW5mbyI6MCwiYXBwaW5mbyI6IjI0NDkyODgyMTkyNjE1ODgwMzMiLCJzcmNfbmFtZSI6IiIsInVucmVhZHVpbnMiOltdLCJyZWZlcmlkIjowLCJjdXN0b21fc2VydmljZSI6IiIsImV4dHJhX2RhdGFzIjoia3J3QkFnb0FvTDRCQUE9PSIsImFzX2lkIjowLCJpbm5lcmtmX3ZpZCI6MCwibm9uZWVkcmVhZHVpbnMiOltdLCJyb29tX2luZm8iOm51bGwsImRlbGF5ZWQtdmVyaWZ5Ijp0cnVlLCJzZXJ2aWNlLWludGVyY2VwdCI6ZmFsc2V9",
    //     "msg_content": "44CC44CC",
    //     "href": "",
    //     "msg_id": "1463008",
    //     "desc": "",
    //     "md5": "",
    //     "voice_time": 0,
    //     "msg_type": 2001
    //   },
    //   "extend": "",
    //   "extendVersionOne": "",
    //   "merchantId": "1654755551412850688",
    //   "optSerNo": "",
    //   "optUserId": "",
    //   "originalParams": "",
    //   "pushService": "",
    //   "resultMsg": "SUCCESS",
    //   "robotId": "",
    //   "serverName": "neighbour-message",
    //   "tgRobotId": "",
    //   "timId": "",
    //   "userId": "",
    //   "vcMerchantNo": "202004240382704",
    //   "version": "",
    //   "vrMerchatId": "",
    //   "vrRobotId": "",
    //   "wxId": "B6DA44544B407789B0BEA81C0A3506675194F219CF554649F1C4F9C615435A82",
    //   "pushTime": 1746970214828,
    //   "resultCode": 1,
    //   "type": 400005
    // }

    const senderWxId: string = params.data.sender_serial_no;
    const receiverWxId: string = params.data.receiver_serial_no;
    const robotWxId: string = params.wxId;
    const message: string = params.data.msg_content;
  }

  async handle905050(params: any) {
    // {"data":{"msgInfo":{"is_file_encrypt":false,"vcHref":"","vcTitle":"","msgSerialNo":"","quoteContentBase64":"eyJleHRyYV9kYXRhczIiOiJ7XCJFWFRSQV9DTE9DS1wiOm51bGwsXCJRVU9URV9NRVNTQUdFXCI6bnVsbCxcIk1FU1NBR0VfTElOS1wiOm51bGwsXCJTT1VSQ0VfQVBQXCI6bnVsbCxcIkVYVFJBX0lOVklURV9ST09NXCI6bnVsbCxcIk1TR19FTkNSWV9LRVlcIjpudWxsLFwiQVBQX0NPTlRST0xcIjpudWxsLFwiREVCVUdfSU5GT1wiOm51bGwsXCJFWFRSQV9NU0dJTUFHRU5BTUVcIjpudWxsLFwiRVhUUkFfSVNfQk9NQl9DT05cIjpmYWxzZSxcIk1TR19HUk9VUFwiOm51bGwsXCJBVFRBVENIRURfQ01EX01TR1wiOm51bGwsXCJhZGRfZmluYW5jZV90aXBzXCI6ZmFsc2UsXCJpc19maW5hbmNlX3hjeFwiOmZhbHNlLFwiaXNfbXNnX25vdF9hcHBlYXJcIjpmYWxzZSxcImlzX2F1ZGl0bXNnX3NlbmRfeGN4XCI6ZmFsc2UsXCJFWFRSQV9VU0VSX0lEX01BUFBJTkdcIjpudWxsLFwiaXNfcHVsbF9wcm9maWxlXCI6ZmFsc2UsXCJpc19uZWVkX3JlZnJlc2hfdG9rZW5cIjpmYWxzZSxcImZvcmNlX2FkZF91bnJlYWRfY250XCI6ZmFsc2UsXCJyb29taGlzdG9yeW1zZ1wiOm51bGwsXCJtYWtlX2FwcG9pbnRtZW50XCI6bnVsbCxcImlzX2JlZW5fc3BhbV9ibG9ja1wiOmZhbHNlLFwibm90X2FkZF91bnJlYWRfY291bnRcIjpmYWxzZSxcIndlYl9tc2dfaWRcIjowLFwid2ViX21zZ19yZWFkX2ZsYWdcIjowLFwicm9vbV9oaXN0b3J5X21zZ19yZXZva2VfZmxhZ1wiOjAsXCJ0ZXh0X21zZ191cmxfaW5mb1wiOm51bGwsXCJyZXZva2Vfcm9vbV9tc2dfYWRtaW5faW5mb1wiOm51bGwsXCJ0ZXh0X21zZ19kb2Nfc2hhcmVfY29kZV9pbmZvXCI6bnVsbCxcImlzX2NvbnRlbnRfbm90X2NoYW5nZVwiOmZhbHNlLFwia2ZfY2hhdF9zdGF0aXN0aWNcIjpudWxsLFwic2hhcmVfdHlwZVwiOjAsXCJpc19ub3RfcmVjZWl2ZV9mbGFnXCI6ZmFsc2UsXCJpc19pbnZpdGVfbW9yZV9wYXJlbnRfZmxhZ1wiOmZhbHNlLFwiaXNfaW52aXRlX3BhcmVudF9ieV9jcmVhdGVcIjpmYWxzZSxcImlzX3JlcGx5X21lXCI6ZmFsc2UsXCJpc19hdF9tZVwiOmZhbHNlLFwibGlua19tc2dfdHlwZVwiOjAsXCJpc19mb3J3YXJkX25vdGljZVwiOmZhbHNlLFwid3hfa2VmdV9tZW51X2xpc3RcIjpudWxsLFwiaXNfa2ZfbWVudV9tc2dcIjpmYWxzZSxcInRvX3dlYl9wcm90b19tZXNzYWdlXCI6bnVsbCxcIm1zZ19hdWRpdF9pbmZvXCI6bnVsbCxcImpzb25fc3RyaW5nXCI6bnVsbCxcImltdW5pb25fY29udGVudHR5cGVcIjowLFwiaW11bmlvbl9jb250ZW50YnVmZlwiOm51bGwsXCJhZGR0aW9uYWxfY29udGVudFwiOm51bGwsXCJzdHlsZV90ZXh0XCI6bnVsbCxcInNpZ25lZF9tc2dfZXh0cmFcIjpudWxsLFwiUlRYX0lORk9cIjpudWxsfSIsInJlY2FsbE1zZ0RldGFpbCI6bnVsbCwibXNnX2lkIjoxNDYzMDE2LCJzeW5jX2tleSI6ODAzMTA5NywiY2hhbm5lbCI6MCwic3JjX3ZpZCI6Nzg4MTMwMTA4NDkxMTEwNSwiZHN0X3ZpZCI6MTY4ODg1NjA0MjU2ODk1MiwiZHN0X3Jvb21faWQiOjAsIm1zZ190eXBlIjoyLCJtc2dfY29udGVudCI6eyJtc2dfbGlzdCI6W3sic3ViX3R5cGUiOjAsImRhdGEiOnsiY29udGVudCI6ImRHVnpkQT09IiwiZXh0cmFfdGltZV9zdGFtcCI6MCwiY29kZV9sYW5ndWFnZSI6MH19XX0sImltYWdlX3VybCI6ImQzZDNlQT09IiwicmVhZHVpbnMiOltdLCJ1bnJlYWR1aW5zY291bnQiOjAsInNlbmR0aW1lIjoxNzQ2OTcyMTA0LCJmbGFnIjoxNjc3NzIxNiwiZGV2aW5mbyI6MCwiYXBwaW5mbyI6IjQyMTYyNDEwNDk0MjA2NjgzNTUiLCJzcmNfbmFtZSI6IiIsInVucmVhZHVpbnMiOltdLCJyZWZlcmlkIjowLCJjdXN0b21fc2VydmljZSI6IiIsImV4dHJhX2RhdGFzIjoia3J3QkFnb0FvTDRCQUE9PSIsImFzX2lkIjowLCJpbm5lcmtmX3ZpZCI6MCwibm9uZWVkcmVhZHVpbnMiOltdLCJyb29tX2luZm8iOm51bGwsImRlbGF5ZWQtdmVyaWZ5Ijp0cnVlLCJzZXJ2aWNlLWludGVyY2VwdCI6ZmFsc2V9","vcDesc":"","msgContent":"dGVzdA==","nPlatformMsgType":10,"nVoiceTime":0,"nMsgType":2001,"dtMsgTime":1746972104000},"toWxId":"B6DA44544B407789B0BEA81C0A3506675194F219CF554649F1C4F9C615435A82","fromWxId":"B60E27D17753E2C65CC2A7EEA8826CD45194F219CF554649F1C4F9C615435A82","msgId":"1463016"},"businessId":"","consumer":"","extend":"","extendVersionOne":"","merchantId":"1654755551412850688","optSerNo":"","optUserId":"","originalParams":"","pushService":"","resultMsg":"SUCCESS","robotId":"","serverName":"neighbour-message","tgRobotId":"","timId":"","userId":"","vcMerchantNo":"202004240382704","version":"","vrMerchatId":"","vrRobotId":"","wxId":"B6DA44544B407789B0BEA81C0A3506675194F219CF554649F1C4F9C615435A82","pushTime":1746972107339,"resultCode":1,"type":905050}
    // {"data":{"msgInfo":{"is_file_encrypt":false,"vcHref":"","vcTitle":"","msgSerialNo":"","quoteContentBase64":"eyJtc2dfaWQiOjEwMzI5NDQsInN5bmNfa2V5Ijo3NDI1NjA4LCJjaGFubmVsIjowLCJzcmNfdmlkIjoxNjg4ODU1MzMyNzI0MTgyLCJkc3RfdmlkIjo3ODgxMzAxMDg0OTExMTA1LCJkc3Rfcm9vbV9pZCI6MCwibXNnX3R5cGUiOjAsIm1zZ19jb250ZW50Ijp7Im1zZ19saXN0IjpbeyJzdWJfdHlwZSI6MCwiZGF0YSI6eyJjb250ZW50IjoiNW9LbzVhVzk3N3lNNW9pUjVwaXY1THFzNUxpYzVhU242STJ2NW9pLzU1cUU1WUdsNWJxMzU2Nmg1NUNHNklDQjViaUk3N3lNNUx1bDVaQ081NVN4NW9pUjVMaTY1b0tvNW8rUTVMNmI1NVNvNkkydjVveUg1YSs4NVpLTTVZR2w1YnEzNVpLbzZLK2k1cHlONVlxaDc3eU01b2lSNTVxRTViZWw1TDJjNXBlMjZaZTA1cGl2T1Rvd01DMHlNam93TU8rOG0rYUNxT1djcU9hY2plaU5yK2FjbittWHRPYWNpZVM3dStTOWxlbVhydW1pbU9XUHIrUzdwZW1haithWHR1V1NxT2l2b3VhSWtlKzhqT1M2ck9TNG5PV2twK2lOcithSXYrZWxuZWFDcU9lVW4rYTB1K2FFaWVXL3ErKzhnUT09IiwiZXh0cmFfdGltZV9zdGFtcCI6MCwiY29kZV9sYW5ndWFnZSI6MH19XX0sImltYWdlX3VybCI6IiIsInJlYWR1aW5zIjpbXSwidW5yZWFkdWluc2NvdW50IjowLCJzZW5kdGltZSI6MTc0NzkyMjg0MiwiZmxhZyI6MTY3NzcyMTYsImRldmluZm8iOjAsImFwcGluZm8iOiJXTUdfMjY3MTA3Mjg5MF8xNjg4ODU1MzMyNzI0MTgyXzc4ODEzMDEwODQ5MTExMDUwXzEiLCJzcmNfbmFtZSI6IiIsInVucmVhZHVpbnMiOltdLCJyZWZlcmlkIjowLCJjdXN0b21fc2VydmljZSI6IiIsImV4dHJhX2RhdGFzIjoiIiwiYXNfaWQiOjAsImlubmVya2ZfdmlkIjowLCJub25lZWRyZWFkdWlucyI6W10sImRlbGF5ZWQtdmVyaWZ5Ijp0cnVlLCJzZXJ2aWNlLWludGVyY2VwdCI6ZmFsc2V9","vcDesc":"","msgContent":"5oKo5aW977yM5oiR5piv5Lqs5Lic5aSn6I2v5oi/55qE5YGl5bq3566h55CG6ICB5biI77yM5Lul5ZCO55Sx5oiR5Li65oKo5o+Q5L6b55So6I2v5oyH5a+85ZKM5YGl5bq35ZKo6K+i5pyN5Yqh77yM5oiR55qE5bel5L2c5pe26Ze05pivOTowMC0yMjowMO+8m+aCqOWcqOacjeiNr+acn+mXtOacieS7u+S9lemXrumimOWPr+S7pemaj+aXtuWSqOivouaIke+8jOS6rOS4nOWkp+iNr+aIv+elneaCqOeUn+a0u+aEieW/q++8gQ==","nPlatformMsgType":10,"nVoiceTime":0,"nMsgType":2001,"dtMsgTime":1747922842000},"toWxId":"B60E27D17753E2C65CC2A7EEA8826CD45194F219CF554649F1C4F9C615435A82","fromWxId":"20011C569FE3793306976B66B76AE9FA5194F219CF554649F1C4F9C615435A82","msgId":"1032944"},"businessId":"","consumer":"","extend":"","extendVersionOne":"","merchantId":"1654755551412850688","optSerNo":"","optUserId":"","originalParams":"","pushService":"","resultMsg":"SUCCESS","robotId":"","serverName":"neighbour-message","tgRobotId":"","timId":"","userId":"","vcMerchantNo":"202004240382704","version":"","vrMerchatId":"","vrRobotId":"","wxId":"20011C569FE3793306976B66B76AE9FA5194F219CF554649F1C4F9C615435A82","pushTime":1747922843688,"resultCode":1,"type":905050}
    const senderWxId: string = params.data.fromWxId;
    const receiverWxId: string = params.data.toWxId;
    const robotWxId: string = params.wxId;
    const message: string = params.data.msgInfo.msgContent;

    // 特殊情况：
    // 1. 刚加好友会有一条“你已添加了Nick，现在可以开始聊天了。”消息，params.data.fromWxId是客户，params.data.toWxId是企微，这不能算作客户开口。eg: {"data":{"msgInfo":{"is_file_encrypt":false,"vcHref":"","vcTitle":"","msgSerialNo":"","quoteContentBase64":"eyJtc2dfaWQiOjEwMzI4MzEsInN5bmNfa2V5Ijo3NDI1NTU1LCJjaGFubmVsIjowLCJzcmNfdmlkIjo3ODgxMzAxMDg0OTExMTA1LCJkc3RfdmlkIjoxNjg4ODU1MzMyNzI0MTgyLCJkc3Rfcm9vbV9pZCI6MCwibXNnX3R5cGUiOjEwMTEsIm1zZ19jb250ZW50IjoiNUwyZzViZXk1cmU3NVlxZzVMcUdUbWxqYSsrOGpPZU9zT1djcU9XUHIrUzdwZVc4Z09XbmkraUJpdVdrcWVTNmh1T0FnZz09IiwiaW1hZ2VfdXJsIjoiIiwicmVhZHVpbnMiOltdLCJ1bnJlYWR1aW5zY291bnQiOjAsInNlbmR0aW1lIjoxNzQ3OTE0Njc5LCJmbGFnIjoxNjc3NzIxNiwiZGV2aW5mbyI6MCwiYXBwaW5mbyI6InhjeF9jcmVhdGVfY29udmVyc2F0aW9uX3RvZ2V0aGVyXzc4ODEzMDEwODQ5MTExMDVfMTY4ODg1NTMzMjcyNDE4Ml8xI3F1ZXVlMkAyMV8xMjFfODBfMjE1QDAjMTc0NzkxNDY3OHw1NTY0OTE2MV8xIiwic3JjX25hbWUiOiIiLCJ1bnJlYWR1aW5zIjpbXSwicmVmZXJpZCI6MCwiY3VzdG9tX3NlcnZpY2UiOiIiLCJleHRyYV9kYXRhcyI6IiIsImFzX2lkIjowLCJpbm5lcmtmX3ZpZCI6MCwibm9uZWVkcmVhZHVpbnMiOltdfQ==","downloadFileSerNo":"","vcDesc":"","msgContent":"你已添加了Nick，现在可以开始聊天了。","nPlatformMsgType":10,"nVoiceTime":0,"nMsgType":10000,"dtMsgTime":1747914679000},"toWxId":"20011C569FE3793306976B66B76AE9FA5194F219CF554649F1C4F9C615435A82","fromWxId":"B60E27D17753E2C65CC2A7EEA8826CD45194F219CF554649F1C4F9C615435A82","msgId":"1032831"},"businessId":"","consumer":"","extend":"","extendVersionOne":"","merchantId":"1654755551412850688","optSerNo":"","optUserId":"","originalParams":"","pushService":"","resultMsg":"SUCCESS","robotId":"","serverName":"neighbour-message","tgRobotId":"","timId":"","userId":"","vcMerchantNo":"202004240382704","version":"","vrMerchatId":"","vrRobotId":"","wxId":"20011C569FE3793306976B66B76AE9FA5194F219CF554649F1C4F9C615435A82","pushTime":1747914680109,"resultCode":1,"type":5}
    if (
      message.includes('你已添加了') ||
      message.includes(
        '5oiR5bey57uP5re75Yqg5LqG5L2g77yM546w5Zyo5oiR5Lus5Y+v5Lul5byA5aeL6IGK5aSp5LqG44CC', // 我已经添加了你，现在我们可以开始聊天了。
      )
    ) {
      return;
    }
    // 2. 有时企微给客户发消息也会触发400005和905050回调，所以params.data.fromWxId有可能是企微编号，而params.wxId永远是企微编号，所以这里判断屏蔽掉。eg: {"businessId":"","consumer":"","data":{"cover_url":"","msg_serial_no":"","msg_time":"2025-05-22 19:53:19.619","title":"","receiver_serial_no":"B60E27D17753E2C65CC2A7EEA8826CD45194F219CF554649F1C4F9C615435A82","sender_serial_no":"20011C569FE3793306976B66B76AE9FA5194F219CF554649F1C4F9C615435A82","file_serial_no":"","msg_content":"5L2g5aW9LOacieS7peS4i+mcgOaxguebtOaOpeWPkeaVsOWtl+e7meaIkSzmiJHluK7kvaDop6PlhrMs5ZKo6K+i5LiN5pS26LS5CuOAkDHjgJHliY3liJfohboK44CQMuOAkeaPkOWNh+ehrOW6pgrjgJAz44CR5o+Q5Y2H5oi/5LqL5pe26Ze0CuOAkDTjgJHmiL/kuovliqnlhbQK44CQNeOAkeWkh+WtlQrjgJA244CR6LCD55CG6Lqr5L2TCuacrOasoeWvueivneWFqOeoi+S/neWvhg==","href":"","msg_id":"1032842","desc":"","md5":"","voice_time":0,"msg_type":2001},"extend":"","extendVersionOne":"","merchantId":"1654755551412850688","optSerNo":"20250522195318711128332141066","optUserId":"","originalParams":"","pushService":"","resultMsg":"SUCCESS","robotId":"","serverName":"neighbour-message","tgRobotId":"","timId":"","userId":"","vcMerchantNo":"202004240382704","version":"","vrMerchatId":"","vrRobotId":"","wxId":"20011C569FE3793306976B66B76AE9FA5194F219CF554649F1C4F9C615435A82","pushTime":1747914799741,"resultCode":1,"type":400005}
    if (robotWxId === senderWxId) {
      return;
    }

    try {
      // 查询客户信息
      const customer = await this.prisma.customer.findUnique({
        where: {
          wxId_freWxId: {
            freWxId: senderWxId,
            wxId: receiverWxId,
          },
        },
      });
      if (!customer) {
        this.logger.error(
          `数据库客户信息不存在，senderWxId: ${senderWxId}, receiverWxId: ${receiverWxId}`,
        );
        return;
      }
      if (customer.kai_kou_zhuang_tai) {
        this.logger.error(
          `客户已开口，senderWxId: ${senderWxId}, receiverWxId: ${receiverWxId}`,
        );
        return;
      }

      // 删标签
      await this.WithThrottleAndRetry(
        () =>
          this.thirdSetEnterFreTag({
            addTags: [],
            delTags: ['1911417568575152128'], // 未开口
            merchatId: '',
            freWxId: senderWxId,
            wxId: receiverWxId,
          }),
        `${this.thirdSetEnterFreTag.name} ${senderWxId} ${receiverWxId}`,
      );

      // 打标签
      await this.WithThrottleAndRetry(
        () =>
          this.thirdSetEnterFreTag({
            addTags: ['1911417568575152129'], // 已开口
            delTags: [],
            merchatId: '',
            freWxId: senderWxId,
            wxId: receiverWxId,
          }),
        `${this.thirdSetEnterFreTag.name} ${senderWxId} ${receiverWxId}`,
      );

      // 保存已开口状态
      await this.prisma.customer.update({
        data: {
          kai_kou_zhuang_tai: true,
        },
        where: {
          wxId_freWxId: {
            freWxId: senderWxId,
            wxId: receiverWxId,
          },
        },
      });
    } catch (error) {
      this.logger.error(error);
    }
  }

  // 开口状态标签组：已开口；未开口
  // 销售主动覆盖次数标签组：销售主动覆盖0次；销售主动覆盖1次；销售主动覆盖2次；销售主动覆盖3次；销售主动覆盖4次；销售主动覆盖5次；销售主动覆盖6次；销售主动覆盖7次；销售主动覆盖8次；销售主动覆盖9次；销售主动覆盖10次；销售主动覆盖11次；销售主动覆盖12次；销售主动覆盖12次以上
  // 客户表中的字段有（客户编号、企微编号、加V时间、覆盖次数、开口状态）
  // 需求：客户添加企微后，开始业务逻辑
  // 加V后，保存客户信息到客户表；删标签（已开口），打标签（未开口、销售主动覆盖0次）；发送预定义的消息；bullmq添加下一次任务
  // 加V后5分钟，判断未开口，删标签（销售主动覆盖x次），打标签（销售主动覆盖x+1次）；发送预定义的消息；bullmq添加下一次任务；若已开口，删标签（未开口），打标签（已开口）
  // 加V后4小时，判断时间超过了20:30，直接bullmq添加下一次任务；未超过，判断未开口，删标签（销售主动覆盖x次），打标签（销售主动覆盖x+1次）；发送预定义的消息；bullmq添加下一次任务；若已开口，删标签（未开口），打标签（已开口）
  // 加V后第2天早上10:00，判断未开口，删标签（销售主动覆盖x次），打标签（销售主动覆盖x+1次）；发送预定义的消息；bullmq添加下一次任务；若已开口，删标签（未开口），打标签（已开口）
  // 加V后第2天晚上18:00，判断未开口，删标签（销售主动覆盖x次），打标签（销售主动覆盖x+1次）；发送预定义的消息；bullmq添加下一次任务；若已开口，删标签（未开口），打标签（已开口）
  // 加V后第3天早上10:00，判断未开口，删标签（销售主动覆盖x次），打标签（销售主动覆盖x+1次）；发送预定义的消息；bullmq添加下一次任务；若已开口，删标签（未开口），打标签（已开口）
  // 加V后第3天晚上18:00，判断未开口，删标签（销售主动覆盖x次），打标签（销售主动覆盖x+1次）；发送预定义的消息；bullmq添加下一次任务；若已开口，删标签（未开口），打标签（已开口）
  // 加V后第10天中午14:00，判断未开口，删标签（销售主动覆盖x次），打标签（销售主动覆盖x+1次）；发送预定义的消息；bullmq添加下一次任务；若已开口，删标签（未开口），打标签（已开口）
  // 加V后第17天中午14:00，判断未开口，删标签（销售主动覆盖x次），打标签（销售主动覆盖x+1次）；发送预定义的消息；bullmq添加下一次任务；若已开口，删标签（未开口），打标签（已开口）
  // 加V后第24天中午14:00，判断未开口，删标签（销售主动覆盖x次），打标签（销售主动覆盖x+1次）；发送预定义的消息；bullmq添加下一次任务；若已开口，删标签（未开口），打标签（已开口）
  // 后续每隔7天中午14:00，以此类推
  // 直到销售主动覆盖次数大于12次，判断未开口，删标签（销售主动覆盖12次），打标签（销售主动覆盖12次以上）；发送预定义的消息；若已开口，删标签（未开口），打标签（已开口）
  async 覆盖次数计划任务(data: {
    freWxId: string;
    wxId: string;
    configTemplate: any;
  }) {
    this.logger.log(this.覆盖次数计划任务.name, data);
    const { freWxId, wxId } = data;
    const customer = await this.prisma.customer.findUnique({
      where: {
        wxId_freWxId: {
          freWxId,
          wxId,
        },
      },
    });
    if (customer === null) {
      // 客户不存在，直接返回
      return;
    }
    if (!customer?.tian_jia_shi_jian) {
      // 没有添加时间
      return;
    }

    // 已开口，删标签（未开口），打标签（已开口）
    if (customer?.kai_kou_zhuang_tai) {
      // 删标签
      await this.WithThrottleAndRetry(
        () =>
          this.thirdSetEnterFreTag({
            addTags: [],
            delTags: [
              '1911417568575152128', // 未开口
            ],
            freWxId: freWxId,
            merchatId: '',
            wxId: wxId,
          }),
        `${this.thirdSetEnterFreTag.name} ${freWxId} ${wxId}`,
      );

      // 打标签
      await this.WithThrottleAndRetry(
        () =>
          this.thirdSetEnterFreTag({
            addTags: [
              '1911417568575152129', // 已开口
            ],
            delTags: [],
            freWxId: freWxId,
            merchatId: '',
            wxId: wxId,
          }),
        `${this.thirdSetEnterFreTag.name} ${freWxId} ${wxId}`,
      );
      return;
    }

    const current覆盖次数 = customer?.fu_gai_ci_shu || 0;
    const promiseTasks: any = [];

    // 更新客户信息
    promiseTasks.push(
      this.prisma.customer.update({
        where: {
          wxId_freWxId: {
            freWxId,
            wxId,
          },
        },
        data: {
          fu_gai_ci_shu: {
            increment: 1,
          },
        },
      }),
    );

    // 删标签
    if (data.configTemplate.deleteTags.length > 0) {
      promiseTasks.push(
        this.WithThrottleAndRetry(
          () =>
            this.thirdSetEnterFreTag({
              addTags: [],
              delTags: data.configTemplate.deleteTags.map((it) => it.tagId),
              freWxId: freWxId,
              merchatId: '',
              wxId: wxId,
            }),
          `${this.thirdSetEnterFreTag.name} ${freWxId} ${wxId}`,
        ),
      );
    }

    // 打标签
    if (data.configTemplate.addTags.length > 0) {
      promiseTasks.push(
        this.WithThrottleAndRetry(
          () =>
            this.thirdSetEnterFreTag({
              addTags: data.configTemplate.addTags.map((it) => it.tagId),
              delTags: [],
              freWxId: freWxId,
              merchatId: '',
              wxId: wxId,
            }),
          `${this.thirdSetEnterFreTag.name} ${freWxId} ${wxId}`,
        ),
      );
    }

    // 发消息
    if (data.configTemplate.message) {
      promiseTasks.push(
        this.WithThrottleAndRetry(
          () =>
            this.privateMessage({
              msgContent: data.configTemplate.message,
              merchatId: '',
              freWxId,
              wxId,
            }),
          `${this.privateMessage.name} ${freWxId} ${wxId}`,
        ),
      );
    }

    // 并行执行操作
    const values = await Promise.all(promiseTasks);
    // 处理并行操作的结果
    values.forEach((result, index) => {
      if (result instanceof Error) {
        this.logger.error(
          `任务 ${index + 1} 执行失败: ${result.message}`,
          result.stack,
        );
      } else {
        this.logger.log(
          `任务 ${index + 1} 执行成功: ${JSON.stringify(result)}`,
        );
      }
    });

    // 达到最大覆盖次数，不添加下一次计划任务
    if (current覆盖次数 === configTemplates.length) {
      return;
    }

    // 未达到最大覆盖次数，添加下一次计划任务
    const configTemplate = configTemplates[current覆盖次数];
    await this.bilinlQueue.add(
      '覆盖次数计划任务',
      {
        freWxId,
        wxId,
        configTemplate,
      },
      {
        delay: dayjs(customer.tian_jia_shi_jian)
          .add(
            configTemplate.taskDelay.add.value,
            configTemplate.taskDelay.add.unit as dayjs.ManipulateType,
          )
          .hour(configTemplate.taskDelay.hour)
          .minute(configTemplate.taskDelay.minute)
          .diff(dayjs()),
        removeOnComplete: true,
        attempts: 3, // 可选重试
        backoff: {
          type: 'exponential', // 每次失败后，等待时间按指数级增长，0 2 4 8 16 32
          delay: 1000,
        },
      },
    );
  }

  // 企微获取商家标签
  // 请求参数为非必填，只传token即可获取商家下所有企业标签信息
  async queryEnterMerchantTagList(params: {
    corpId: string;
    groupId: string;
    tagIds: string[];
    tagName: string;
  }) {
    try {
      const response: AxiosResponse = await lastValueFrom(
        this.httpService.post(
          'https://gateway.bilinl.com/thirdparty/personal/queryEnterMerchantTagList',
          params,
        ),
      );
      this.logger.log(response.data);
    } catch (error) {
      this.logger.error(error);
    }
  }

  // 【企微】根据企微好友获取标签
  async queryEnterFreTag(params: { freWxId: string; wxId: string }) {
    try {
      const response = await lastValueFrom(
        this.httpService.post(
          'https://gateway.bilinl.com/thirdparty/personal/queryEnterMerchantTagList',
          params,
        ),
      );
      this.logger.log(response.data);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async thirdSetEnterFreTag(params: {
    addTags: string[];
    delTags: string[];
    freWxId: string;
    merchatId: string;
    wxId: string;
  }) {
    const response = await lastValueFrom(
      this.httpService.post(
        'https://gateway.bilinl.com/thirdparty/personal/thirdSetEnterFreTag',
        params,
      ),
    );
    // {"code":10000,"data":null,"extra":null,"message":"同一个号的好友，5秒内只能打1个标签","path":"","timestamp":1747048647603}
    // {"code":0,"data":[{"failTagIds":[],"failureReason":"","freWxId":"","optSerNo":"","successTagIds":[],"wxId":""}],"extra":null,"message":"success","path":"","timestamp":1746979433209}
    if (response.data.code === 0) {
      return response.data;
    } else {
      throw new Error(JSON.stringify(response.data)); // 触发重试
    }
  }

  // 发消息
  // TODO：控制间隔时间
  async privateMessage(params: {
    msgContent: string;
    freWxId: string;
    merchatId: string;
    wxId: string;
  }) {
    const response = await lastValueFrom(
      this.httpService.post(
        'https://gateway.bilinl.com/thirdparty/personal/privateMessage',
        {
          data: [
            {
              maxTimeValue: '',
              minTimeValue: '',
              msgContent: params.msgContent,
              msgNum: 1,
              msgType: '2001',
              quoteContentBase64: '',
              smateId: '',
              vcDesc: '',
              vcHref: '',
              vcTitle: '',
              voiceTime: '',
            },
          ],
          freWxId: params.freWxId,
          identity: '',
          merchatId: params.merchatId,
          msgBusiType: '',
          privateMsgType: '',
          relaSerialNo: '',
          subMerchantDesc: '',
          sysUserId: '',
          userSerialNo: '',
          wxId: params.wxId,
          wxType: '2',
        },
      ),
    );
    // {"code":0,"data":{"data":null,"optSerNo":"20250520162405343127726063341","resultCode":0,"resultMsg":"success"},"extra":null,"message":"success","path":"","timestamp":1747729445388}
    if (response.data.code === 0) {
      return response.data;
    } else {
      throw new Error(JSON.stringify(response.data)); // 触发重试
    }
  }

  // TODO: 自动清理超过一定时间的调用记录
  private callTimestamps: Record<string, number> = {};

  async WithThrottleAndRetry<T>(
    callback: () => T | Promise<T>,
    jobId: string,
    maxRetries: number = 3,
    minInterval: number = 15 * 1000,
  ): Promise<T> {
    const lastCallTime = this.callTimestamps[jobId] || 0;
    const timeSinceLastCall = Date.now() - lastCallTime;

    if (timeSinceLastCall < minInterval) {
      const delay = minInterval - timeSinceLastCall;
      this.logger.log(`[ThrottleAndRetry] [${jobId}] delay ${delay}ms.`);
      // TODO: 改为bullmq的延迟队列
      await new Promise((resolve) => setTimeout(resolve, delay)); // sleep
      this.logger.log(`[ThrottleAndRetry] [${jobId}] after ${delay}ms.`);
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // 更新调用时间
        this.callTimestamps[jobId] = Date.now();

        this.logger.log(
          `[ThrottleAndRetry] [${jobId}] 尝试第 ${attempt + 1} 次.`,
        );

        const data = await callback(); // Works for both sync and async functions

        this.logger.log(
          `[ThrottleAndRetry] [${jobId}] 尝试第 ${attempt + 1} 次，响应：${JSON.stringify(data)}`,
        );

        return data;
      } catch (error) {
        this.logger.error(
          `[ThrottleAndRetry] [${jobId}] 第 ${attempt + 1} 次请求失败，重试中...`,
          error,
        );
      }
    }

    throw new Error(
      `[ThrottleAndRetry] [${jobId}] 请求失败，已重试 ${maxRetries} 次.`,
    );
  }
}
