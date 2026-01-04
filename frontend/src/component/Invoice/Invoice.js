import React,{useState} from 'react'
import InvoicePDF from './InvoicePDF';
import InputForm from './InputForm';
import signatureImage from '../sign.jpg';

const Invoice = () => {
  const [invoiceData, setInvoiceData] = useState({
    sellerDetails:{
        name:"Varasiddhi Silk Exports",
        address:{
            street:"75, 3rd Cross, Lalbagh Road",
            city:"BENGALURU",
            state:"KARNATAKA",
            pincode:"560027",
            countryAbbr:"IN"
        },
        pan:"AAFCV1234A",
        gstRegistrationNo:"29AACFV1234A1Z5",
    },
    billingDetails:{
        name:"Madhu B",
        address:{
            addressLine1:"Eurofins IT Solutions India Pvt Ltd, 1st Floor",
            addressLine2:"Maruti Platinum, Lakshminarayan Pura, AECS Layou",
            city:"BENGALURU",
            state:"KARNATAKA",
            pincode:"560037",
            countryAbbr:"IN",
            utCode:"29"
        },
    },
    shippingDetails:{
        name:"Madhu B",
        address:{
            addressLine1:"Eurofins IT Solutions India Pvt Ltd, 1st Floor",
            addressLine2:"Maruti Platinum, Lakshminarayan Pura, AECS Layou",
            city:"BENGALURU",
            state:"KARNATAKA",
            pincode:"560037",
            countryAbbr:"IN",
            utCode:"29"
        },
    },
    placeOfDelivery:"KARNATAKA",
    placeOfSupply:"KARNATAKA",
    orderSummary:{
        orderNo:"403-3258454-3258454",
        orderDate:"28.10.2019"
    },
    invoiceSummary:{
        invoiceNo:"IN-2754",
        invoiceDetails:"KA-4514531512-1920",
        invoiceDate:"28.10.2019",
    },
    reverseCharge:"No",
    itemList:[
        {
            description:"Varasiddhi Silks Men's Formal Shirt (SH-06-42, Navy Blue,42) | B07KGF3KW8 (SH-05--42)",
            unitPrice:"538.10",
            quantity:"1",
            discount:"",
            taxRate:"5"
        },
        {
            description:"Varasiddhi Silks Men's Formal Shirt (SH-06-42, Navy Blue,42) | B07KGF3KW8 (SH-05--42)",
            unitPrice:"538.10",
            quantity:"1",
            discount:"",
            taxRate:"5"
        }
    ],
    signatureImage:signatureImage
  });
  const [fillForm,setFillForm] = useState(true);

  const handleMainFormData = ((data)=>{
    setInvoiceData(data);
    setFillForm(false);
  });

  return (
    <>
        {fillForm?
        <InputForm handleMainFormData={handleMainFormData}  />:
        <InvoicePDF invoiceData={invoiceData} setFillForm={setFillForm} />
        }
        
    </>
  )
}
export default Invoice;