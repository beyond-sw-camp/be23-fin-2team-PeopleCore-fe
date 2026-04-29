import { useEffect, useState } from 'react'
import { payItemsApi } from '../api/payAdmin'

export interface PayItemMeta {
  taxExemptLimit: number
  isTaxable: boolean
}

// payItemId → 비과세 메타 (한도액 + 과세여부)
export function usePayItemMeta(): Record<number, PayItemMeta> {
  const [meta, setMeta] = useState<Record<number, PayItemMeta>>({})
  useEffect(() => {
    payItemsApi.getList('PAYMENT')
      .then(items => {
        const map: Record<number, PayItemMeta> = {}
        for (const it of items) {
          map[it.payItemId] = {
            taxExemptLimit: it.taxExemptLimit ?? 0,
            isTaxable: it.isTaxable,
          }
        }
        setMeta(map)
      })
      .catch(() => { /* 권한 없거나 실패 시 안내만 미노출 */ })
  }, [])
  return meta
}

// 비과세 안내문구 (한도 있음 / 전액 비과세 / 미노출)
export function taxExemptHintText(
  taxExemptLimit: number | null | undefined,
  isTaxable: boolean | null | undefined,
): string | null {
  const limit = taxExemptLimit ?? 0
  if (limit > 0) return `비과세한도액 ${limit.toLocaleString('ko-KR')}원`
  if (isTaxable === false) return '전액 비과세 항목'
  return null
}

// 항목 금액 중 과세대상 금액 (백엔드 TaxableCalc.taxablePart 와 동일 정책)
//   isTaxable=true                       → 전액 과세
//   isTaxable=false, taxExemptLimit>0    → max(0, amt - cap)
//   isTaxable=false, taxExemptLimit<=0   → 전액 비과세 (= 0)
//   meta 미상                            → 보수적으로 전액 과세
export function taxablePart(amount: number, meta: PayItemMeta | undefined): number {
  const amt = Math.max(0, amount)
  if (!meta) return amt
  if (meta.isTaxable) return amt
  if (meta.taxExemptLimit <= 0) return 0
  return Math.max(0, amt - meta.taxExemptLimit)
}
