import React from 'react'
import styles from '../styles/shippingDetails.module.css';
const ShippingDetails = ({name,address}) => {
  return (
    <div className={styles.shippingDetails}>
        <span className={styles.label}>Shipping Address : </span>
        <span>{name}</span>
        <span>{address.addressLine1}</span>
        <span>{address.addressLine2}</span>
        <span>{address.city}, {address.state}, {address.pincode}</span>
        <span>{address.countryAbbr}</span>
        <span><span className={styles.label}>State/UT Code:</span> {address.utCode}</span>
    </div>
  )
}

export default ShippingDetails