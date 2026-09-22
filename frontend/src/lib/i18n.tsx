'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TenderStatus } from '../types';

export type Language = 'en' | 'zh';

export const DICTIONARY = {
  en: {
    // Navigation
    nav_dashboard: 'Terminal',
    nav_create: 'Create Tender',
    nav_tenders: 'Explorer',
    nav_agents: 'Agent Fleet',
    nav_vault: 'Stake Vault',
    nav_docs: 'Protocol Spec',

    // Network & Account
    network_arc: 'Arc Testnet',
    block: 'Block',
    gas_native: 'Gas: USDC',
    faucet_btn: 'Official Faucet ↗',
    faucet_minting: 'Minting...',
    faucet_success: '+100 USDC Minted',
    balance: 'Balance',
    wallet_preset: 'Preset',
    wallet_reown: 'Reown',
    wallet_connect: 'Connect Wallet',
    wallet_disconnect: 'Disconnect',
    network_label: 'Network',
    gas_label: 'Gas Token',
    gas_val: 'Native USDC',
    faucet_link: 'Get Testnet USDC (Faucet)',
    copy_address: 'Copy Address',
    address_copied: 'Address Copied',
    view_explorer: 'View on ArcScan ↗',
    manage_wallet: 'Manage in Reown Modal',
    refresh_balance: 'Refresh Balance',

    // Creator Form
    create_title: 'Create Reverse Tender',
    create_desc: 'Publish a reverse auction with escrowed USDC on Arc L1',
    presets: 'Presets',
    preset_financial: 'Financial YoY',
    preset_audit: 'Contract Audit',
    preset_synthesis: 'Spec Synthesis',
    prompt_label: 'Task Objective / Prompt',
    prompt_placeholder: 'Specify computational objective or metadata URI...',
    max_budget: 'Max Budget',
    bidding_window: 'Bidding Window',
    exec_window: 'Execution Window',
    btn_publish: 'Escrow USDC & Broadcast Tender',
    broadcasting: 'Broadcasting to Arc L1...',
    published_success: 'Tender Published',
    view_live_auction: 'View Live Bidding',

    // Fleet Monitor
    fleet_title: 'Agent Fleet',
    nodes_ready: '4/4 Qualified',
    bids: 'Bids',
    wins: 'Wins',
    earned: 'Earned',
    staked: 'Staked',

    // Live Arena
    arena_title: 'Live Bidding Arena',
    select_tender: 'Tender',
    bidding_countdown: 'Bidding Window',
    challenge_countdown: 'Challenge Window',
    finalized: 'Finalized',
    lowest_bid: 'Lowest Bid',
    initial_budget: 'Budget',
    saved_ratio: 'Saved',
    leader: 'Leader',
    awaiting_first_bid: 'Awaiting first bid',
    total_bids: 'On-Chain Bids',
    price_trajectory: 'Price Tumble Trajectory',
    bids_timeline: 'Bidding Log',
    empty_bids: 'No bids placed yet',
    empty_tender_title: 'No Tender Selected',
    empty_tender_desc: 'Publish a reverse tender or select an existing one to observe live bids.',
    create_tender_btn: '+ New Tender',
    seconds_unit: 'seconds',
    entries_unit: 'entries',
    floor_label: 'Floor',
    step_label: 'Step',
    creator_escrow: 'Creator Escrow',

    // Status translations
    status_open: 'Open (Bidding)',
    status_awarded: 'Awarded',
    status_delivered: 'Delivered (Challenge)',
    status_settled: 'Settled',
    status_cancelled: 'Cancelled',
    status_expired: 'Expired',

    // Logs
    logs_title: 'Machine Telemetry Stream',
    filter_all: 'All Agents',
    auto_scroll: 'Auto-scroll',
    waiting_logs: 'Listening to on-chain events and agent RPC feeds...',

    // Settlement
    settlement_status_title: 'Settlement Status',
    settlement_finalized: 'Settlement Complete',
    settlement_verification: 'Delivery Verification',
    badge_settled: 'SETTLED',
    badge_delivered: 'DELIVERED',
    confirm_payout_btn: 'Confirm Delivery (Release Payout)',
    confirming_payout: 'Releasing payout...',
    claim_payout_btn: 'Claim Optimistic Payout',
    claiming_payout: 'Claiming payout...',
    winner: 'Winner',
    payout_amount: 'Payout',
    refund_amount: 'Refund to Creator',
    payload_output: 'Execution Output',
    view_payload: 'View Payload',
    hide_payload: 'Hide Payload',
    copy: 'Copy',
    copied: 'Copied',
    active_tender: 'Active Tender',
    winning_node: 'Winning Node',
    clearing_price: 'Clearing Price',
    inspect_payload_btn: 'Inspect Payload',
    cleared_escrow_badge: '✓ Cleared Escrow',
    delivery_payload_title: 'Delivery Payload',
    delivery_payload_desc: 'Cryptographically signed execution output submitted on-chain.',
    result_summary: 'Result Summary',
    execution_telemetry: 'Execution Telemetry',
    raw_verification_json: 'Raw Verification JSON',
    close_btn: 'Close',

    // Explorer Page
    explorer_title: 'Tender Explorer',
    search_placeholder: 'Search by objective or tender ID...',
    all_status: 'All Statuses',
    filter_open: 'Open (Bidding)',
    filter_awarded: 'Awarded',
    filter_delivered: 'Delivered (Challenge)',
    filter_settled: 'Settled',
    th_id: 'ID',
    th_task: 'Task Objective',
    th_budget: 'Max Budget',
    th_lowest: 'Lowest Bid',
    th_winner: 'Leader Node',
    th_status: 'Status',
    th_action: 'Action',
    action_view: 'View',

    // Agents Page
    agents_title: 'Autonomous Fleet Analytics',
    stat_nodes: 'Active Nodes',
    stat_staked: 'Staked Capital',
    stat_volume: 'Total Cleared',
    stat_completed: 'Completed Tasks',
    model_type: 'Model',
    strategy: 'Strategy',
    min_margin: 'Margin Floor',
    stake_status: 'Stake',

    // Vault Page
    vault_title: 'Stake Vault & Capital Reserve',
    vault_desc: 'Anti-griefing stake management and protocol escrow liquidity',
    user_stake: 'Your Staked Capital',
    total_staked_pool: 'Total Fleet Stake',
    min_qualification: 'Min Qualification Threshold',
    deposit_stake_title: 'Deposit Stake',
    withdraw_stake_title: 'Withdraw Stake',
    stake_amount_label: 'Stake Amount (USDC)',
    deposit_btn: 'Deposit Stake',
    withdraw_btn: 'Withdraw Stake',
    slashing_rule_title: 'Slashing & Anti-Griefing Mechanism',
    slashing_rule_desc: 'Agents must stake >= 0.01 USDC to submit bids. Defaulting on delivery triggers automatic slashing of 0.01 USDC, paid directly to the creator as compensation.',

    // Docs Page
    docs_title: 'AgentTender Protocol Specification',

    // Theme
    theme_light: 'Light',
    theme_dark: 'Dark',
    theme_system: 'System',
  },
  zh: {
    // Navigation
    nav_dashboard: '竞价终端',
    nav_create: '发起招标',
    nav_tenders: '招标浏览器',
    nav_agents: '智能体网络',
    nav_vault: '质押金库',
    nav_docs: '协议规范',

    // Network & Account
    network_arc: 'Arc 测试网',
    block: '区块',
    gas_native: 'Gas: USDC',
    faucet_btn: '官方领水 ↗',
    faucet_minting: '正在领水...',
    faucet_success: '+100 USDC 领取成功',
    balance: '可用余额',
    wallet_preset: '预设',
    wallet_reown: 'Reown',
    wallet_connect: '连接钱包',
    wallet_disconnect: '断开连接',
    network_label: '当前网络',
    gas_label: 'Gas 燃料',
    gas_val: '原生 USDC',
    faucet_link: '官方领水 (USDC Faucet) ↗',
    copy_address: '复制完整地址',
    address_copied: '地址已复制',
    view_explorer: '在 ArcScan 浏览器查看 ↗',
    manage_wallet: '管理钱包 (Reown)',
    refresh_balance: '刷新余额',

    // Creator Form
    create_title: '发起逆向招标',
    create_desc: '在 Arc L1 链上质押 USDC 托管并发起微型逆向拍卖',
    presets: '快速模板',
    preset_financial: '财务同比研判',
    preset_audit: '合约安全审计',
    preset_synthesis: '规范自动化提炼',
    prompt_label: '任务目标 / Prompt',
    prompt_placeholder: '明确计算目标或输入元数据 URI...',
    max_budget: '最高限额 (USDC)',
    bidding_window: '竞价窗口 (秒)',
    exec_window: '交付窗口 (秒)',
    btn_publish: '托管 USDC 并全网广播招标单',
    broadcasting: '正在链上广播...',
    published_success: '招标单已发布',
    view_live_auction: '进入竞价大厅',

    // Fleet Monitor
    fleet_title: '活跃智能体网络',
    nodes_ready: '4/4 质押就绪',
    bids: '出价',
    wins: '中标',
    earned: '已结算',
    staked: '已质押',

    // Live Arena
    arena_title: '实时机器竞价大厅',
    select_tender: '招标单',
    bidding_countdown: '竞价倒计时',
    challenge_countdown: '乐观交割期',
    finalized: '已清算',
    lowest_bid: '当前最低出价',
    initial_budget: '初始预算',
    saved_ratio: '节省',
    leader: '领先智能体',
    awaiting_first_bid: '等待出价',
    total_bids: '链上出价',
    price_trajectory: '价格断崖下降阶梯走势',
    bids_timeline: '出价时序',
    empty_bids: '暂无出价记录',
    empty_tender_title: '未选择招标单',
    empty_tender_desc: '请在上方发起新招标单，或从历史下拉列表中选择以查看实时机器博弈。',
    create_tender_btn: '+ 发起新招标',
    seconds_unit: '秒',
    entries_unit: '条记录',
    floor_label: '底价',
    step_label: '步进',
    creator_escrow: '需求方托管',

    // Status translations
    status_open: '竞价中 (Open)',
    status_awarded: '已决标 (Awarded)',
    status_delivered: '待挑战 (Delivered)',
    status_settled: '已结清 (Settled)',
    status_cancelled: '已取消 (Cancelled)',
    status_expired: '已失效 (Expired)',

    // Logs
    logs_title: '机器博弈与推理时序日志',
    filter_all: '全部智能体',
    auto_scroll: '自动滚动',
    waiting_logs: '正在监听链上事件与智能体出价电报...',

    // Settlement
    settlement_status_title: '清算与交割状态',
    settlement_finalized: '链上清算已完成',
    settlement_verification: '成果乐观交付验证',
    badge_settled: '已结清',
    badge_delivered: '待确认',
    confirm_payout_btn: '确认交付物 (释放报酬)',
    confirming_payout: '正在链上放款...',
    claim_payout_btn: '乐观期免许可放款',
    claiming_payout: '正在提款...',
    winner: '胜出智能体',
    payout_amount: '结算报酬',
    refund_amount: '退还差额',
    payload_output: '交付成果 Payload',
    view_payload: '查看成果 Payload',
    hide_payload: '收起成果 Payload',
    copy: '复制',
    copied: '已复制',
    active_tender: '当前招标单',
    winning_node: '胜出节点',
    clearing_price: '清算价格',
    inspect_payload_btn: '检视交付成果',
    cleared_escrow_badge: '✓ 托管已结清释放',
    delivery_payload_title: '交付成果 Payload 详情',
    delivery_payload_desc: '链上提交并包含密码学签名的计算输出结果。',
    result_summary: '执行摘要',
    execution_telemetry: '执行遥测指标',
    raw_verification_json: '原始验证 JSON',
    close_btn: '关闭',

    // Explorer Page
    explorer_title: '招标单浏览器',
    search_placeholder: '根据任务内容或编号检索...',
    all_status: '全量状态',
    filter_open: '竞价中 (Open)',
    filter_awarded: '已决标 (Awarded)',
    filter_delivered: '待挑战 (Delivered)',
    filter_settled: '已结清 (Settled)',
    th_id: '编号',
    th_task: '任务目标',
    th_budget: '最高预算',
    th_lowest: '当前最低',
    th_winner: '领先节点',
    th_status: '状态',
    th_action: '操作',
    action_view: '查看',

    // Agents Page
    agents_title: '自治智能体网络统计',
    stat_nodes: '在线节点',
    stat_staked: '质押金库资金',
    stat_volume: '累计清算量',
    stat_completed: '交付任务数',
    model_type: '模型架构',
    strategy: '博弈策略',
    min_margin: '边际利润底线',
    stake_status: '质押状态',

    // Vault Page
    vault_title: '质押金库与资金储备',
    vault_desc: '防恶意弃标保证金管理与协议托管流动性',
    user_stake: '个人质押资本',
    total_staked_pool: '集群总质押量',
    min_qualification: '准入门槛 (单次质押)',
    deposit_stake_title: '存入保证金',
    withdraw_stake_title: '提取保证金',
    stake_amount_label: '质押金额 (USDC)',
    deposit_btn: '存入 Stake',
    withdraw_btn: '提取 Stake',
    slashing_rule_title: '违约罚没与反女巫惩罚规则',
    slashing_rule_desc: '智能体参与竞标前需在金库质押 >= 0.01 USDC。若中标后在交付窗口内违约未交付，合约自动罚没 0.01 USDC 并作为经济赔偿直接转入需求方账户。',

    // Docs Page
    docs_title: 'AgentTender 协议架构规范',

    // Theme
    theme_light: '浅色',
    theme_dark: '深色',
    theme_system: '跟随系统',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof DICTIONARY['en']) => string;
  getStatusText: (status: number | TenderStatus, fallback?: string) => string;
  localizeLogMessage: (msg: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'zh',
  setLanguage: () => {},
  t: (key) => DICTIONARY.zh[key] || key,
  getStatusText: () => '',
  localizeLogMessage: (msg) => msg,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh');

  useEffect(() => {
    const saved = localStorage.getItem('agent_tender_lang') as Language;
    if (saved && (saved === 'zh' || saved === 'en')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('agent_tender_lang', lang);
  };

  const t = (key: keyof typeof DICTIONARY['en']): string => {
    const dict = DICTIONARY[language] || DICTIONARY.en;
    return dict[key] || DICTIONARY.en[key] || key;
  };

  const getStatusText = (status: number | TenderStatus, fallback?: string): string => {
    const s = Number(status);
    if (s === TenderStatus.OPEN) return t('status_open');
    if (s === TenderStatus.AWARDED) return t('status_awarded');
    if (s === TenderStatus.DELIVERED) return t('status_delivered');
    if (s === TenderStatus.SETTLED) return t('status_settled');
    if (s === TenderStatus.CANCELLED) return t('status_cancelled');
    if (s === TenderStatus.EXPIRED) return t('status_expired');
    return fallback || '';
  };

  const localizeLogMessage = (msg: string): string => {
    if (language !== 'zh') return msg;

    // Localize common telemetry log messages for Chinese UI
    // e.g. "Bid accepted! Agent-Alpha leads at 0.004 USDC!"
    let out = msg;
    out = out.replace(/^Bid accepted!\s*/, '出价已采纳！');
    out = out.replace(/^On-chain TX confirmed!\s*/, '链上交易已确认！');
    out = out.replace(/\bleads at\b/, '以领先价');
    out = out.replace(/Tender #(\d+) detected\. Max budget:\s*([0-9.]+)\s*USDC\. Bidding window:\s*(\d+)s\./, '检测到招标单 #$1，最高预算：$2 USDC，竞价窗口：$3 秒。');
    out = out.replace(/Tender #(\d+) detected! Max budget:\s*([0-9.]+)\s*USDC/, '检测到招标单 #$1！最高预算：$2 USDC');
    out = out.replace(/Tender #(\d+) AWARDED to ([^!]+)! Winning bid:\s*([0-9.]+)\s*USDC\. Generating execution payload\.\.\./, '招标单 #$1 决标给 $2！最终中标价：$3 USDC，正在生成交付物...');
    out = out.replace(/Calculated competitive micro-bid:\s*([0-9.]+)\s*USDC\s*\(Margin:\s*(\d+%)\)\.\s*Submitting\.\.\./, '计算最优微出价：$1 USDC（边际利润：$2），提交中...');
    out = out.replace(/Task fulfilled and delivered! Challenge window \(15s\) started\./, '任务计算完毕并已在链上交付！进入 15 秒乐观挑战期。');
    out = out.replace(/Atomic settlement complete! Winner paid\s*([0-9.]+)\s*USDC\.\s*Creator refunded\s*([0-9.]+)\s*USDC savings\./, '原子清算完成！向胜出者支付 $1 USDC，向需求方退还节省资金 $2 USDC。');
    out = out.replace(/Atomic settlement complete! Winner paid\s*([0-9.]+)\s*USDC\./, '原子清算完成！向胜出者支付 $1 USDC。');
    return out;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getStatusText, localizeLogMessage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
