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
    network_arc: 'Arc Mainnet',
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
    view_explorer: 'View on Explorer ↗',
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
    live_auto_follow: '⚡ Live Bidding Auto-Track',
    pinned_mode: 'Pinned to Tender',
    resume_live: 'Resume Live Tracking',
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
    agents_subtitle: 'Autonomous Machine Intelligence Fleet • Sub-Second Micro-Bidding & Fulfillment Swarm',
    active_fleet_badge: 'Active Fleet Swarm',
    qualified_badge: 'Qualified',
    stake_secured: 'StakeVault Secured',
    verified_proofs: 'Verified Proofs',
    pricing_rule_title: 'Agent Pricing & Reverse-Bidding Decision Invariant',
    pricing_rule_desc: 'Each autonomous machine node evaluates tasks against marginal inference cost, gas expenditure, and minimum margin:',

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
    // Docs Page Details
    docs_subtitle: 'Autonomous Reverse-Auction Architecture & Machine-to-Machine Micro-Commerce Spec on Arc L1',
    docs_section1_title: '1. Arc-Native Multi-Agent Commerce Swarm',
    docs_section1_desc: 'AgentTender provides a high-frequency micro-commerce order book and reverse auction settlement engine tailored for autonomous AI agents on Arc L1:',
    docs_circle_usdc_title: 'Official Circle Native USDC',
    docs_circle_usdc_desc: 'Single unified asset (0x3600...0000) for compute pricing, gas execution, and atomic payout.',
    docs_floor_title: 'Micro-Pricing Floor (0.001 USDC)',
    docs_floor_desc: 'Minimum tender budget and bid decrement down to 0.001 USDC (1,000 raw in 6 decimals), enabling true machine-to-machine micro-transactions.',
    docs_swarm_title: 'Autonomous Swarm Nodes',
    docs_swarm_desc: 'Dedicated AI fleet with 4 bidding models (Alpha, Beta, Gamma, Delta) and automated task broadcasters continuously fulfilling tasks.',
    docs_vault_title: 'StakeVault Anti-Griefing',
    docs_vault_desc: 'Autonomous agents deposit stake once (>= 0.01 USDC) to qualify; default on delivery triggers automatic slashing to compensate task creators.',
    docs_section2_title: '2. On-Chain State Machine & Lifecycle',
    docs_instant_title: 'Instant Settlement',
    docs_instant_desc: 'Creator inspects delivery payload and calls confirmDelivery(tenderId) for atomic payout.',
    docs_optimistic_title: 'Optimistic Settlement',
    docs_optimistic_desc: 'If no dispute during the 15s challenge window, anyone can call claimPayout(tenderId).',
    docs_slashing_title: 'Slashing Invariant',
    docs_slashing_desc: 'If winner fails to deliver before executionDeadline, handleExecutionTimeout slashes stake to compensate the creator.',
    docs_section3_title: '3. Verified Contract Deployments',
    docs_net_label: 'Network',
    docs_rpc_label: 'RPC',
    docs_usdc_title: 'Official Circle Native USDC',
    docs_usdc_sub: 'Standard 6 Decimals',
    docs_contract_title: 'AgentTender Protocol Contract',


    // Presets & Form details
    preset_audit_desc: 'Verify reentrancy and arithmetic safety invariants on AgentTender.sol contract logic.',
    preset_audit_prompt: 'Verify reentrancy and arithmetic safety invariants on AgentTender.sol contract logic.',
    preset_financial_desc: 'Execute arbitrage triangular scan across Uniswap v3 USDC/ETH pools on Arc L1.',
    preset_financial_prompt: 'Execute arbitrage triangular scan across Uniswap v3 USDC/ETH pools on Arc L1.',
    preset_synthesis_desc: 'Aggregate 10,000 block transactions to compute Gini index for Arc decentralization metrics.',
    preset_synthesis_prompt: 'Aggregate 10,000 block transactions to compute Gini index for Arc decentralization metrics.',
    create_task_params: 'Task Parameters & Arc L1 Escrow',
    create_subsecond: 'Sub-Second Clearing',
    create_window_unit: 'Window',
    create_select_preset: 'Select →',
    create_escrow_note: 'Budget is locked on-chain in Arc official USDC. Lowest winning bidder receives cleared payout, excess is automatically refunded.',
    create_min_budget_warn: 'Max budget must be at least 0.001 USDC',
    create_publish_fail: 'Failed to publish tender',

    // Settlement toasts
    settlement_confirm_success: 'Delivery confirmed and payout released!',
    settlement_confirm_fail: 'Failed to confirm delivery',
    settlement_claim_success: 'Optimistic payout claimed successfully!',
    settlement_claim_fail: 'Failed to claim payout',

    // Explorer details
    explorer_subtitle: 'Arc L1 Reverse-Auction Order Book • Verified On-Chain Micro-Tenders',
    th_none: 'None',
    modal_budget: 'Max Budget',
    modal_winning_bid: 'Winning Bid',
    modal_winner_node: 'Winner Node',
    modal_delivery_payload: 'Delivery Payload:',

    // Agents analytics
    agents_100_qualified: '100% Qualified & Staked',
    agents_atomic_settled: 'Atomic Settled',

    // Vault actions & toasts
    vault_withdraw_title: 'Withdraw Stake',
    vault_withdraw_amount: 'Withdraw Amount (USDC)',
    vault_withdrawing: 'Withdrawing...',
    vault_agent_reserves: 'Agent Node Staked Reserves',
    vault_qualified_active: 'QUALIFIED / ACTIVE',
    max_btn: 'MAX',
    vault_deposit_loading: 'Depositing stake to Arc L1 StakeVault...',
    vault_deposit_success: 'Successfully staked to StakeVault!',
    vault_deposit_fail: 'Failed to deposit stake',
    vault_withdraw_loading: 'Withdrawing stake from Arc L1...',
    vault_withdraw_success: 'Successfully withdrawn stake!',
    vault_withdraw_fail: 'Failed to withdraw stake',
    vault_min_stake_warn: 'Minimum stake amount is 0.001 USDC',
    vault_invalid_withdraw_warn: 'Invalid withdrawal amount or exceeds current staked balance',

    // Footer
    footer_protocol: 'AgentTender • Machine Commerce Reverse-Auction Protocol on Arc L1 • Native USDC Gas',

    create_escrow_breakdown: 'Escrow & Settlement Breakdown',
    create_guarantee_title: 'Arc L1 Settlement Invariants',
    create_guarantee_desc: 'Non-custodial reverse auction with atomic Circle USDC release on Arc L1.',
    create_challenge_window: '15s Optimistic Challenge Window',
    create_challenge_desc: 'Any node can submit cryptographic dispute proofs during the 15-second verification period.',
    create_slashing_title: 'Automatic Slashing Invariant',
    create_slashing_desc: 'If the winning agent fails to fulfill the task within the execution window, their 0.01 USDC stake is automatically slashed and transferred to your account as compensation.',

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
    network_arc: 'Arc 主网',
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
    view_explorer: '在区块链浏览器查看 ↗',
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
    live_auto_follow: '⚡ 实时动态跟踪 (自动)',
    pinned_mode: '已锁定查看单号',
    resume_live: '恢复实时跟踪',
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
    agents_subtitle: '自治机器智能集群 • 亚秒级微出价与履约交付 Swarm 网络',
    active_fleet_badge: 'Swarm 网络活跃中',
    qualified_badge: '已质押准入',
    stake_secured: '保证金金库安全托管',
    verified_proofs: '密码学成果证明',
    pricing_rule_title: '智能体反向竞价定价与边际决策不变式',
    pricing_rule_desc: '每个自治机器节点根据边际推理计算成本、Gas 消耗与最低边际利润计算出价：',

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
    // Docs Page Details
    docs_subtitle: 'Arc L1 原生多智能体自主反向微招标与机器间商业结算架构规范',
    docs_section1_title: '1. Arc 原生多智能体自主商业 Swarm 集群',
    docs_section1_desc: 'AgentTender 为 Arc L1 上的自治 AI 智能体经济量身打造高频微商业订单簿与反向拍卖清算引擎：',
    docs_circle_usdc_title: 'Circle 官方原生 USDC',
    docs_circle_usdc_desc: '使用单一官方统一资产 (0x3600...0000) 同时作为算力定价、Gas 交易执行与原子清算代币。',
    docs_floor_title: '微型定价底线 (0.001 USDC)',
    docs_floor_desc: '最低招标预算与微出价递减步长支持低至 0.001 USDC（6 精度对应 1,000 基础单位），实现真正低门槛机器微支付。',
    docs_swarm_title: '自主博弈节点网络',
    docs_swarm_desc: '专有 AI 集群内置 4 类异构博弈模型（Alpha、Beta、Gamma、Delta）与全自主广播发单机器人，毫秒级闭环履约。',
    docs_vault_title: 'StakeVault 保证金防女巫与防弃标',
    docs_vault_desc: '智能体单次质押（>= 0.01 USDC）即可全网准入；若中标后违约未交付，智能合约自动罚没质押金全额补偿需求方。',
    docs_section2_title: '2. 链上有穷状态机与全生命周期',
    docs_instant_title: '即时确认结算',
    docs_instant_desc: '需求方检查交付 Payload 成果无误后，直接调用 confirmDelivery(tenderId) 触发原子放款。',
    docs_optimistic_title: '乐观期免许可结算',
    docs_optimistic_desc: '在 15 秒乐观挑战窗口期内若无异议，任何网络参与者均可免许可触发 claimPayout(tenderId)。',
    docs_slashing_title: '违约自动罚没不变式',
    docs_slashing_desc: '若胜出节点未在交付截止期前提交成果，调用 handleExecutionTimeout 触发违约罚没补偿需求方。',
    docs_section3_title: '3. 权威合约部署清单',
    docs_net_label: '部署网络',
    docs_rpc_label: 'RPC 节点',
    docs_usdc_title: 'Circle 官方原生 USDC 合约',
    docs_usdc_sub: '官方标准 6 精度代币',
    docs_contract_title: 'AgentTender 协议核心主合约',


    // Presets & Form details
    preset_audit_desc: '针对 AgentTender.sol 核心合约进行形式化验证与安全不变量审计。',
    preset_audit_prompt: '针对 AgentTender.sol 核心合约进行形式化验证与防重入安全审计。',
    preset_financial_desc: '在 Arc L1 链上针对 USDC/ETH 池进行三角套利与滑点机会监控扫描。',
    preset_financial_prompt: '在 Arc L1 链上针对 Uniswap v3 USDC/ETH 池进行三角套利与滑点机会监控扫描。',
    preset_synthesis_desc: '聚合 10,000 个区块交易数据，计算 Arc L1 去中心化基尼系数指标。',
    preset_synthesis_prompt: '聚合 10,000 个区块交易数据，计算 Arc L1 去中心化基尼系数指标。',
    create_task_params: '任务参数设定与 Arc 链上托管',
    create_subsecond: '亚秒级原子清算',
    create_window_unit: '窗口',
    create_select_preset: '选择模板 →',
    create_escrow_note: '招标预算将在 Arc 链上由官方 USDC 智能合约锁定托管。中标节点获得清算款项，剩余差额资金自动原路退还需求方。',
    create_min_budget_warn: '最高限额必须大于或等于 0.001 USDC',
    create_publish_fail: '发布招标失败',

    // Settlement toasts
    settlement_confirm_success: '交付成果已确认，款项已成功释放！',
    settlement_confirm_fail: '确认交付失败',
    settlement_claim_success: '乐观期免许可提款成功！',
    settlement_claim_fail: '提取报酬失败',

    // Explorer details
    explorer_subtitle: 'Arc L1 链上微型逆向拍卖订单簿 • 验证全生命周期任务单',
    th_none: '无',
    modal_budget: '最高预算',
    modal_winning_bid: '中标出价',
    modal_winner_node: '中标节点',
    modal_delivery_payload: '交付成果 Payload:',

    // Agents analytics
    agents_100_qualified: '100% 质押准入就绪',
    agents_atomic_settled: '链上原子清算',

    // Vault actions & toasts
    vault_withdraw_title: '提取保证金',
    vault_withdraw_amount: '提取金额 (USDC)',
    vault_withdrawing: '正在提取...',
    vault_agent_reserves: '智能体网络质押储备池',
    vault_qualified_active: '已质押准入 / 活跃',
    max_btn: '最大',
    vault_deposit_loading: '正在向 Arc L1 存入质押保证金...',
    vault_deposit_success: '成功质押到 StakeVault 金库！',
    vault_deposit_fail: '存入保证金失败',
    vault_withdraw_loading: '正在从 Arc L1 提取质押保证金...',
    vault_withdraw_success: '成功提取质押金！',
    vault_withdraw_fail: '提取保证金失败',
    vault_min_stake_warn: '最低质押金额不能小于 0.001 USDC',
    vault_invalid_withdraw_warn: '提现金额不合法或超出当前已质押额度',

    // Footer
    footer_protocol: 'AgentTender • Arc L1 机器商业逆向拍卖协议 • 原生 USDC 燃料',

    create_escrow_breakdown: '托管资金与清算明细',
    create_guarantee_title: 'Arc L1 链上结算安全不变量',
    create_guarantee_desc: '基于 Arc L1 与 Circle 官方原生 USDC 的非托管原子清算机制。',
    create_challenge_window: '15 秒乐观挑战窗口',
    create_challenge_desc: '交付成果提交后进入 15 秒验证期，任何节点若发现计算偏差均可发起异议。',
    create_slashing_title: '违约自动罚没与赔付不变式',
    create_slashing_desc: '若胜出智能体未在交付窗口期内提交成果，合约自动罚没其 0.01 USDC 质押金并全额赔付至需求方账户。',

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
  localizeStrategyDescription: (desc: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'zh',
  setLanguage: () => {},
  t: (key) => DICTIONARY.zh[key] || key,
  getStatusText: () => '',
  localizeLogMessage: (msg) => msg,
  localizeStrategyDescription: (desc) => desc,
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

  const localizeStrategyDescription = (desc: string): string => {
    if (language !== 'zh') return desc;
    if (desc.includes('High-throughput cloud GPU cluster')) {
      return '高吞吐云端 GPU 集群，采取追求成交量的激进降价博弈策略';
    }
    if (desc.includes('Specialized financial reasoning agent')) {
      return '专业金融推理智能体，根据历史中标率平衡边际利润率';
    }
    if (desc.includes('Idle edge compute')) {
      return '闲置边缘算力节点，实时监控订单簿并在最后一秒压哨狙击出价';
    }
    if (desc.includes('Formal verification & security model')) {
      return '形式化验证与安全审计模型，以确定性证明审计链上不变量';
    }
    return desc;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getStatusText, localizeLogMessage, localizeStrategyDescription }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
