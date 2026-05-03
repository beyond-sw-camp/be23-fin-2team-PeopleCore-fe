// 오픈뱅킹 표준은행코드 (bank_code_std)
// 참고: https://developers.openbanking.or.kr → 참가기관/공동표준코드
export interface Bank {
  code: string      // 3자리 표준코드
  name: string
}

export const BANKS: readonly Bank[] = [
  { code: '004', name: 'KB국민은행' },
  { code: '088', name: '신한은행' },
  { code: '020', name: '우리은행' },
  { code: '081', name: '하나은행' },
  { code: '011', name: 'NH농협은행' },
  { code: '003', name: 'IBK기업은행' },
  { code: '090', name: '카카오뱅크' },
  { code: '092', name: '토스뱅크' },
  { code: '089', name: '케이뱅크' },
  { code: '023', name: 'SC제일은행' },
  { code: '027', name: '한국씨티은행' },
  { code: '002', name: 'KDB산업은행' },
  { code: '007', name: '수협은행' },
  { code: '031', name: '대구은행' },
  { code: '032', name: '부산은행' },
  { code: '034', name: '광주은행' },
  { code: '035', name: '제주은행' },
  { code: '037', name: '전북은행' },
  { code: '039', name: '경남은행' },
  { code: '045', name: '새마을금고' },
  { code: '048', name: '신협' },
  { code: '071', name: '우체국' },
] as const

export function findBankByName(name: string | null | undefined): Bank | undefined {
  if (!name) return undefined
  return BANKS.find(b => b.name === name)
}

export function findBankByCode(code: string | null | undefined): Bank | undefined {
  if (!code) return undefined
  return BANKS.find(b => b.code === code)
}
