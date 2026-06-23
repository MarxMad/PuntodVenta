import { useCallback, useEffect, useState } from 'react'
import { db } from '../../lib/db'
import type { CashSession, Product, Sale } from '../../lib/types'
import { usePermissions } from '../../contexts/PermissionsContext'
import { Spinner } from './Products'
import { C, gradient, shadow } from '../../theme'
import ChargePanel from './pos/ChargePanel'
import HistoryPanel from './pos/HistoryPanel'
import CashPanel from './pos/CashPanel'

type Tab = 'cobrar' | 'historial' | 'caja'

const TABS: { id: Tab; label: string }[] = [
  { id: 'cobrar', label: 'Cobrar' },
  { id: 'historial', label: 'Historial' },
  { id: 'caja', label: 'Corte de caja' },
]

export default function POS() {
  const { session } = usePermissions()
  const [tab, setTab] = useState<Tab>('cobrar')
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [cashSession, setCashSession] = useState<CashSession | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const [p, s, c] = await Promise.all([
      db.listProducts(),
      db.listSales(),
      db.getOpenCashSession(),
    ])
    setProducts(p)
    setSales(s)
    setCashSession(c)
  }, [])

  useEffect(() => {
    reload().finally(() => setLoading(false))
  }, [reload])

  if (loading) return <Spinner />

  const soldBy = { name: session?.name ?? 'Usuario', email: session?.email ?? '' }

  return (
    <div className="cap-fade">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 18px', borderRadius: 999, fontWeight: 700, fontSize: 14,
              border: `1px solid ${tab === t.id ? 'transparent' : C.border}`,
              background: tab === t.id ? gradient.brand : C.white,
              color: tab === t.id ? '#fff' : C.pinkSoft,
              boxShadow: tab === t.id ? shadow.btn : 'none',
            }}
          >
            {t.label}
            {t.id === 'caja' && cashSession && (
              <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.9 }}>● abierta</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'cobrar' && (
        <ChargePanel
          products={products}
          cashSession={cashSession}
          soldBy={soldBy}
          onReload={reload}
        />
      )}
      {tab === 'historial' && <HistoryPanel sales={sales} onReload={reload} />}
      {tab === 'caja' && (
        <CashPanel
          cashSession={cashSession}
          sales={sales}
          soldBy={soldBy}
          onReload={reload}
        />
      )}
    </div>
  )
}
