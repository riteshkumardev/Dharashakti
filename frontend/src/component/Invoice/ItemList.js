import React from 'react'
import styles from '../styles/itemList.module.css'
import Item from './Item'
import signatureImage from '../sign.jpg';

var numberToText = require('number2text');

function round(num, decimalPlaces = 0) {
  if (num < 0)
      return -round(-num, decimalPlaces);

  num = Math.round(num + "e" + decimalPlaces);
  return Number(num + "e" + -decimalPlaces);
}

const ItemList = ({itemList, taxType}) => {
  const calculateNetAmount = (item) => {
    const unitPrice = parseFloat(item.unitPrice) || 0; // Handle missing unitPrice
    const quantity = parseFloat(item.quantity) || 0; // Handle missing quantity
    const discount = parseFloat(item.discount) || 0; // Handle missing discount
    return round(unitPrice * quantity - discount, 2);
  };
  
  const calculateDiscount = (item) => {
    return parseFloat(item.discount) || 0; // Handle missing discount
  };
  const calculateTaxAmount = (item) => {
    const netAmount = calculateNetAmount(item);
    const taxRate = parseFloat(item.taxRate) || 0; // Handle missing taxRate
    return round(netAmount * taxRate / 100, 2);
  };

  const calculateTotalAmount = (item) => {
    const netAmount = calculateNetAmount(item);
    const taxAmount = calculateTaxAmount(item);
    return round(netAmount + taxAmount, 2);
  };
  let total_discount = itemList.reduce((acc, item) => acc + calculateDiscount(item), 0);
  let total_amount = itemList.reduce((acc, item) => acc + calculateTotalAmount(item), 0);
  return (
    <div className={styles.itemList}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.table__header}>
                <th>Sl. No</th>
                <th>Description</th>
                <th>Unit Price</th>
                <th>Qty</th>
                <th>Net Amount</th>
                <th>Tax Rate</th>
                <th>Tax Type</th>
                <th>Tax Amount</th>
                 {total_discount===0 ? null : <th>Discount</th>}
                <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {itemList.map((itemDetails,index)=>{
                return <Item sl={index+1} 
                 itemDetails={itemDetails}
                  taxType={taxType}
                  totalDiscount={total_discount}
                />
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={7}>TOTAL:</td>
              <td className={styles.totals}>
                {/* Calculate and display total tax amount */}
                {itemList.reduce((acc, item) => acc + calculateTaxAmount(item), 0)}
              </td>
              {/* Display total discount If discount !=0 */}
              {total_discount===0 ? null : <td className={styles.totals}>{total_discount}</td>}
              <td className={styles.totals}>
                {total_amount}
              </td>
            </tr>
            <tr>
              <td  colSpan={10}>
              Amount in Words:
              <span className={styles.words}>{numberToText(total_amount,'',true)}</span>
              </td>
            </tr>
            <tr  >
              <td colSpan={10} className={styles.sign}>
                <span>For Varasiddhi Silk Exports:</span>
                <span><img src={signatureImage} alt="Signature" height={50} /></span>
                <span>Authorised Signatory</span>
              </td>
            </tr>
          </tfoot>
        </table>
    </div>
  )
}

export default ItemList;