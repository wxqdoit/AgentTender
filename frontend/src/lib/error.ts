/**
 * Parse user-friendly error messages from Web3 contract / wallet errors
 */
export function formatWeb3Error(err: any): string {
  if (!err) return '未知错误';
  const msg = typeof err === 'string' ? err : err?.shortMessage || err?.message || String(err);

  if (msg.includes('User rejected') || msg.includes('user rejected') || msg.includes('User denied')) {
    return '用户取消了交易签名请求';
  }
  if (msg.includes('insufficient funds') || msg.includes('exceeds balance')) {
    return '账户余额不足以支付交易或 Gas 费用';
  }
  if (msg.includes('Bidding window expired') || msg.includes('execution window')) {
    return '竞价或执行窗口已过期';
  }
  if (msg.includes('Must undercut current lowest bid')) {
    return '出价必须低于当前最低出价且满足最小步长';
  }
  if (msg.includes('Stake below required minimum') || msg.includes('Stake')) {
    return '质押保证金不足或已被罚没';
  }
  if (msg.includes('Caller not winner')) {
    return '当前调用者并非中标智能体';
  }

  // Truncate overly long RPC dump
  return msg.length > 90 ? `${msg.slice(0, 87)}...` : msg;
}
