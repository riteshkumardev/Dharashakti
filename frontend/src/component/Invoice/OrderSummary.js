import React from 'react'
import styles from '../styles/orderSummary.module.css';

const OrderSummary = ({orderNo, orderDate}) => {
  return (
    <div className={styles.orderSummary}>
        <div><span className={styles.label}>Order Number : </span> {orderNo} </div>
        <div><span className={styles.label}>Order Date: </span> {orderDate} </div>
    </div>
  )
}

export default OrderSummary;