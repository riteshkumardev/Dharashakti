import React from 'react'
import styles from '../styles/sellerDetails.module.css';
// to show seller details
const SellerDetails = ({name,address,pan,gstRegistrationNo}) => {
  return (
    <div className={styles.sellerDetails}>
        <span className={styles.sellerDetails__label}>Sold By:</span> {/* Bold label */}
        <span className={styles.sellerDetails__name}>{name}</span>
        <span className={styles.sellerDetails__addressLine1}>{address.addressLine1}</span>  {/* Address line 1 */}
        {address.addressLine2 && <span className={styles.sellerDetails__addressLine2}>{address.addressLine2}</span>}  {/* Address line 2 */}
        <span className={styles.sellerDetails__addressLine2}>{address.city}, {address.state}, {address.pincode}</span>
        <span className={styles.sellerDetails__countryAbbr}>{address.countryAbbr}</span>
        <span className={styles.sellerDetails__panDetails}>
            <span>Pan No:</span> {pan}
        </span>
        <span className={styles.sellerDetails__gstinDetails}>
            <span>GST Registration No:</span> {gstRegistrationNo}
        </span>
    </div>
  )
}

export default SellerDetails;