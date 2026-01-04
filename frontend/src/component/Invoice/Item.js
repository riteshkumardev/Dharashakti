import React from 'react'
import styles from '../styles/item.module.css';
function round(num, decimalPlaces = 0) {
  num = Math.round(num + "e" + decimalPlaces);
  return Number(num + "e" + -decimalPlaces);
}

const Item = ({sl,itemDetails,taxType,totalDiscount}) => {
    console.log(totalDiscount)
  //error checkings
    if(!itemDetails.description){
        console.error("Description is missing")
        alert("Description is missing")
    }
    if(!itemDetails.unitPrice){
        console.error("Unit Price is missing")
        alert("Unit Price is missing")
    }
    if(!itemDetails.quantity){
        console.error("Quantity is missing")
        alert("Quantity is missing")
    }
    if(!itemDetails.taxRate){
        console.error("Tax Rate is missing")
        alert("Tax Rate is missing")
    }
    if(!itemDetails.discount){
        console.error("Discount is missing")
        alert("Discount is missing")
    }

    // parse checking
    if(!parseFloat(itemDetails.unitPrice)){
      console.error("Unit Price is not a number")
      itemDetails.unitPrice = 0;
    }
    if(!parseFloat(itemDetails.quantity)){
      console.error("Quantity is not a number")
      alert("Quantity is not a number")
    }
    if(!parseFloat(itemDetails.taxRate)){
      console.error("Tax Rate is not a number")
      alert("Tax Rate is not a number")
    }
    if(!parseFloat(itemDetails.discount)){
      itemDetails.discount = 0
      console.error("Discount is not a number")
    }

    // calculate net amount
    let net_amount  = round(parseFloat(itemDetails.unitPrice) * parseFloat(itemDetails.quantity) - parseFloat(itemDetails.discount),2)
    // calculate tax amount
    let tax_amount = round(net_amount * parseFloat(itemDetails.taxRate)/100,2)
    // calculate total amount
    let total_amount = round(net_amount + tax_amount,2)

  return (
        <>
        <tr>
            <td>{sl}</td>
            <td>{itemDetails.description}</td>
            <td>{itemDetails.unitPrice}</td>
            <td>{itemDetails.quantity}</td>
            <td>{net_amount}</td>
            <td>
              {taxType === "IGST" ? itemDetails.taxRate : `${itemDetails.taxRate / 2}`}%
              {/* adding for sgst */}
                {taxType === "IGST" ? null : (
                  <span className={styles.sgst}>
                    {itemDetails.taxRate / 2}%
                  </span>
                )}
            </td>
            <td>
            {taxType === "IGST" ? itemDetails.taxType : "CGST"}
            {taxType === "IGST" ? null : <span className={styles.sgst}>SGST</span>}
            </td>
            <td>{taxType === "IGST" ? tax_amount : tax_amount / 2 }
                {taxType === "IGST" ? null : (
                  <span className={styles.sgst}>
                    {tax_amount / 2 }
                  </span>
                ) }
            </td>
            {totalDiscount === 0 ? null : <td>{itemDetails.discount}</td>}
            <td>{total_amount}</td>
        </tr>
      </>
  )
}

export default Item;