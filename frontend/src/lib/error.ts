/**
 * Parse user-friendly error messages from Web3 contract / wallet errors
 */
export function formatWeb3Error(err: any, lang: 'zh' | 'en' = 'zh'): string {
  if (!err) return lang === 'zh' ? '未知错误' : 'Unknown error';
  const msg = typeof err === 'string' ? err : err?.shortMessage || err?.message || String(err);

  if (msg.includes('User rejected') || msg.includes('user rejected') || msg.includes('User denied')) {
    return lang === 'zh' ? '用户取消了交易签名请求' : 'Transaction signature rejected by user';
  }
  if (msg.includes('insufficient funds') || msg.includes('exceeds balance')) {
    return lang === 'zh' ? '账户余额不足以支付交易或 Gas 费用' : 'Insufficient balance for transaction or gas fees';
  }
  if (msg.includes('Bidding window expired') || msg.includes('execution window')) {
    return lang === 'zh' ? '竞价或执行窗口已过期' : 'Bidding or execution window has expired';
  }
  if (msg.includes('Must undercut current lowest bid')) {
    return lang === 'zh' ? '出价必须低于当前最低出价且满足最小步长' : 'Bid must undercut current lowest bid by minimum step';
  }
  if (msg.includes('Stake below required minimum') || msg.includes('Stake')) {
    return lang === 'zh' ? '质押保证金不足或已被罚没' : 'Stake balance is below minimum or has been slashed';
  }
  if (msg.includes('Caller not winner')) {
    return lang === 'zh' ? '当前调用者并非中标智能体' : 'Caller is not the awarded winner node';
  }

  // Truncate overly long RPC dump
  return msg.length > 90 ? `${msg.slice(0, 87)}...` : msg;
}
