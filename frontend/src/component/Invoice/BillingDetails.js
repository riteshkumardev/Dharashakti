import React from 'react'
import styles from '../styles/billingDetails.module.css';
const BillingDetails = ({name,address}) => {
  if (!name || !address) {
    return <div>Missing billing details!</div>; // Handle missing props
  }
  return (
    <div className={styles.billingDetails}>
        <span className={styles.billingDetails__label}>Billing Address : </span>
        <span>{name}</span>
        <span>{address.addressLine1}</span>
        <span>{address.addressLine2}</span>
        <span>{address.city}, {address.state}, {address.pincode}</span>
        <span>{address.countryAbbr}</span>
        <span><span className={styles.label}>State/UT Code:</span> {address.utCode}</span>
    </div>
  )
}

export default BillingDetails