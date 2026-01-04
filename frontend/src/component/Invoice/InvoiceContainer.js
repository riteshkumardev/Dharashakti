import React from 'react';

import SellerDetails from './SellerDetails';
import BillingDetails from './BillingDetails';
import ShippingDetails from './ShippingDetails';
import OrderSummary from './OrderSummary';
import InvoiceSummary from './InvoiceSummary';
import ItemList from './ItemList';

import logo from '../logo.png';
import styles from '../styles/invoiceContainer.module.css';

const defaultInvoiceData = {
  placeOfSupply: "",
  placeOfDelivery: "",
  reverseCharge: "No",

  sellerDetails: {
    name: "",
    address: "",
    pan: "",
    gstRegistrationNo: ""
  },

  billingDetails: {
    name: "",
    address: ""
  },

  shippingDetails: {
    name: "",
    address: ""
  },

  orderSummary: {
    orderNo: "",
    orderDate: ""
  },

  invoiceSummary: {
    invoiceNo: "",
    invoiceDetails: "",
    invoiceDate: ""
  },

  itemList: []
};

const InvoiceContainer = ({ invoiceData = defaultInvoiceData }) => {

  // ✅ SAFE TAX TYPE LOGIC
  const taxType =
    invoiceData.placeOfSupply &&
    invoiceData.placeOfDelivery &&
    invoiceData.placeOfSupply === invoiceData.placeOfDelivery
      ? "CGST + SGST"
      : "IGST";

  return (
    <div className={styles.invoiceContainer}>
      <div className={`${styles.line} ${styles.header}`}>
        <img src={logo} alt="logo" className={styles.invoiceContainer__logo} />
        <div className={styles.invoiceContainer__header}>
          Tax Invoice / Bill of Supply / Cash Memo
          <span>(Original for Recipient)</span>
        </div>
      </div>

      <div className={styles.line}>
        <SellerDetails
          name={invoiceData.sellerDetails.name}
          address={invoiceData.sellerDetails.address}
          pan={invoiceData.sellerDetails.pan}
          gstRegistrationNo={invoiceData.sellerDetails.gstRegistrationNo}
        />
        <BillingDetails
          name={invoiceData.billingDetails.name}
          address={invoiceData.billingDetails.address}
        />
      </div>

      <div className={styles.line}>
        <div></div>
        <ShippingDetails
          name={invoiceData.shippingDetails.name}
          address={invoiceData.shippingDetails.address}
        />
      </div>

      <div className={styles.line}>
        <div></div>
        <div>
          <div>
            <span className={styles.label}>Place of Supply: </span>
            {invoiceData.placeOfSupply || "-"}
          </div>
          <div>
            <span className={styles.label}>Place of Delivery: </span>
            {invoiceData.placeOfDelivery || "-"}
          </div>
        </div>
      </div>

      <div className={styles.line}>
        <OrderSummary
          orderNo={invoiceData.orderSummary.orderNo}
          orderDate={invoiceData.orderSummary.orderDate}
        />
        <InvoiceSummary
          invoiceNo={invoiceData.invoiceSummary.invoiceNo}
          invoiceDetails={invoiceData.invoiceSummary.invoiceDetails}
          invoiceDate={invoiceData.invoiceSummary.invoiceDate}
        />
      </div>

      <ItemList itemList={invoiceData.itemList} taxType={taxType} />

      <div className={styles.line}>
        <div>
          Whether tax is payable under reverse charge –{" "}
          {invoiceData.reverseCharge}
        </div>
      </div>
    </div>
  );
};

export default InvoiceContainer;
