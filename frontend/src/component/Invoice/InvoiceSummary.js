import React from 'react'
import styles from '../styles/invoiceSummary.module.css'

// This component displays a summary of the invoice including invoice number, details, and date
const InvoiceSummary = ({invoiceNo, invoiceDetails, invoiceDate}) => {
  return (
    <div className={styles.invoiceSummary}>
        <div><span className={styles.label}>Invoice Number : </span> {invoiceNo} </div>
        <div><span className={styles.label}>Invoice Details : </span> {invoiceDetails} </div>
        <div><span className={styles.label}>Invoice Date: </span> {invoiceDate} </div>
    </div>
  )
}

export default InvoiceSummary;