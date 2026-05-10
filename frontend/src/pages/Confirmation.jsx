import React, { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectCurrentOrder } from '../store/selectors'
import { formatRubles } from '../utils/money'
import utilStyles from '../styles/utilities.module.css'

const STATUS_LABELS = {
  pending: 'Ожидает обработки',
  processing: 'В обработке',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменен',
}

const DELIVERY_TYPE_LABELS = {
  delivery: 'Доставка по адресу',
  pickup: 'Самовывоз',
}

export default function Confirmation() {
  const location = useLocation()
  const reduxOrder = useSelector(selectCurrentOrder)
  const order = location.state?.order || reduxOrder
  const [copied, setCopied] = useState(false)

  function handleCopyOrderId() {
    navigator.clipboard.writeText(String(order.id))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!order) {
    return (
      <div className={utilStyles.page_status}>
        <h1>Заказ не найден</h1>
        <p>Вернитесь в каталог для оформления нового заказа.</p>
        <Link to="/catalog" className={utilStyles.primary_button}>
          Перейти в каталог
        </Link>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: '28px' }}>
      <section className={utilStyles.success_box} style={{ padding: '28px', marginBottom: '24px', borderRadius: '24px', textAlign: 'center', color: '#25603a', background: '#eefaf2' }}>
        <p className={utilStyles.eyebrow} style={{ color: '#25603a' }}>Успешно</p>
        <h1 style={{ margin: '0 0 10px', color: '#25603a' }}>Заказ #{order.id} принят!</h1>
        <p>Спасибо за покупку. Вы получите уведомление об обновлении статуса.</p>
        <button
          type="button"
          className={utilStyles.primary_button}
          onClick={handleCopyOrderId}
          style={{ marginTop: '16px', minWidth: '200px' }}
        >
          {copied ? '✓ Скопировано' : 'Копировать номер заказа'}
        </button>
      </section>

      <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', boxShadow: 'var(--shadow)', padding: '24px', marginBottom: '24px' }}>
        <p className={utilStyles.eyebrow}>Детали заказа</p>
        <h2 style={{ margin: '0 0 20px', fontSize: '22px' }}>Реквизиты доставки</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>
          <div>
            <span style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: '6px' }}>Фамилия и имя</span>
            <strong>{order.recipient_name || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: '6px' }}>Телефон</span>
            <strong>{order.recipient_phone || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: '6px' }}>Способ получения</span>
            <strong>{DELIVERY_TYPE_LABELS[order.delivery_type] || order.delivery_type || 'N/A'}</strong>
          </div>
          {order.delivery_type === 'delivery' && (
            <div>
              <span style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: '6px' }}>Адрес доставки</span>
              <strong>{order.delivery_address || 'N/A'}</strong>
            </div>
          )}
          <div>
            <span style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: '6px' }}>Метод оплаты</span>
            <strong>{order.payment_method === 'card_online' ? 'Карта онлайн' : 'Наличные'}</strong>
          </div>
        </div>

        {order.comment && (
          <div style={{ marginBottom: '20px' }}>
            <span style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: '6px' }}>Комментарий</span>
            <p style={{ margin: '0', color: 'var(--muted)' }}>{order.comment}</p>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <span style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: '6px' }}>Статус</span>
          <strong style={{ fontSize: '18px' }}>{STATUS_LABELS[order.status] || order.status || 'Ожидает обработки'}</strong>
        </div>
      </section>

      {order.items && order.items.length > 0 && (
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', boxShadow: 'var(--shadow)', padding: '24px', marginBottom: '24px' }}>
          <p className={utilStyles.eyebrow}>Состав заказа</p>
          <h2 style={{ margin: '0 0 20px', fontSize: '22px' }}>Товары</h2>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: '700' }}>Товар</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: '700' }}>Цена</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: '700' }}>Кол-во</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: '700' }}>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px' }}>
                    <strong>{item.productName || 'N/A'}</strong>
                  </td>
                  <td style={{ padding: '14px' }}>{formatRubles(item.unitPrice || 0)}</td>
                  <td style={{ padding: '14px' }}>{item.quantity}</td>
                  <td style={{ padding: '14px' }}>{formatRubles(item.lineTotal || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: 'var(--muted)' }}>Итого: </span>
              <strong style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.04em' }}>{formatRubles(order.total || 0)}</strong>
            </div>
          </div>
        </section>
      )}

      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Link to="/catalog" className={utilStyles.primary_button}>
          Вернуться в каталог
        </Link>
      </div>
    </div>
  )
}
