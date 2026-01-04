import React, { useState } from 'react';
import '../styles/Form.css';

function ItemList ({itemList, handleChange, setFormData}) {
    return (
        <>
            {itemList.map((_, index) => (
                <div className='form-group' data-index={index}>
                    <span className='title success'>Item {index + 1}</span>
                    <label>
                        Description:
                        <input
                            type="text"
                            name="description"
                            value={itemList[index].description}
                            onChange={handleChange}
                        />
                    </label>
                    <label>
                        Unit Price:
                        <input
                            type="number"
                            step="0.01"
                            name="unitPrice"
                            value={itemList[index].unitPrice}
                            onChange={handleChange}
                        />
                    </label>
                    <label>
                        Quantity:
                        <input
                            type="number"
                            step="0.01"
                            name="quantity"
                            value={itemList[index].quantity}
                            onChange={handleChange}
                        />
                    </label>
                    <label>
                        Discount:
                        <input
                            type="number"
                            step="0.01"
                            name="discount"
                            value={itemList[index].discount}
                            onChange={handleChange}
                        />
                    </label>
                    <label>
                        Tax Rate:
                        <input
                            type="number"
                            step="0.01"
                            name="taxRate"
                            value={itemList[index].taxRate}
                            onChange={handleChange}
                        />
                    </label>
                    <button type="button" className='danger' onClick={() => setFormData((prevFormData) => ({ ...prevFormData, itemList: prevFormData.itemList.filter((_, i) => i !== index) }))}>Delete Item</button>
                </div>
            ))}
            <button type="button" className='info' onClick={() => setFormData((prevFormData) => ({ ...prevFormData, itemList: [...prevFormData.itemList, {
                description: "",
                unitPrice: "",
                quantity: "",
                discount: "",
                taxRate: ""
            }] }))}>Add Item</button>
        </>
    );
}


function Address ({address, handleChange}) {
    return (
        <>
            <label>
                Address Line 1:
                <input
                    type="text"
                    name="addressLine1"
                    value={address.addressLine1}
                    onChange={handleChange}
                />
            </label>
            <label>
                Address Line 2:
                <input
                    type="text"
                    name="addressLine2"
                    value={address.addressLine2}
                    onChange={handleChange}
                />
            </label>
            <label>
                City:
                <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleChange}
                />
            </label>
            <label>
                State:
                <input
                    type="text"
                    name="state"
                    value={address.state}
                    onChange={handleChange}
                />
            </label>
            <label>
                Pincode:
                <input
                    type="text"
                    name="pincode"
                    value={address.pincode}
                    onChange={handleChange}
                />
            </label>
            <label>
                Country Abbreviation:
                <input
                    type="text"
                    name="countryAbbr"
                    value={address.countryAbbr}
                    onChange={handleChange}
                />
            </label>
        </>
    );
}

function InvoiceForm({handleMainFormData}) {
  const [formData, setFormData] = useState({
    sellerDetails:{
        name:"Varasiddhi Silk Exports",
        address:{
            addressLine1:"75, 3rd Cross, Lalbagh Road",
            addressLine2:"Sudhama Nagar, Near Urvashi Theatre",
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
    reverseCharge:"yes",
    itemList:[]
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
    
  };
  const handleSellerChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({ ...prevFormData, sellerDetails: {...prevFormData.sellerDetails, [name]: value } }));
    
};
  const handleAddressSellerChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({ ...prevFormData, sellerDetails: {...prevFormData.sellerDetails, address: {...prevFormData.sellerDetails.address,[name]:value} } }));
    
};
  const handleBillingAddressChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({ ...prevFormData, billingDetails: {...prevFormData.billingDetails, address: {...prevFormData.billingDetails.address,[name]:value} } }));
    
};
  const handleShippingAddressChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({ ...prevFormData, shippingDetails: {...prevFormData.shippingDetails, address: {...prevFormData.shippingDetails.address,[name]:value} } }));
    
};
    const handleBillingChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({ ...prevFormData, billingDetails: {...prevFormData.billingDetails, [name]: value } }));
    };

    const handleShippingChange = (event) => {
        const { name, value } = event.target;
        setFormData((prevFormData) => ({ ...prevFormData, shippingDetails: {...prevFormData.shippingDetails, [name]: value } }));
    };

    const handleOrderChange = (event) => {
        const { name, value } = event.target;
        setFormData((prevFormData) => ({ ...prevFormData, orderSummary: {...prevFormData.orderSummary, [name]: value } }));
    };

    const handleInvoiceChange = (event) => {
        const { name, value } = event.target;
        setFormData((prevFormData) => ({ ...prevFormData, invoiceSummary: {...prevFormData.invoiceSummary, [name]: value } }));
    };

    const handleItemChange = (event) => {
        const { name, value } = event.target;

        // Get the index of the item being edited
        const index = parseInt(event.target.closest('.form-group').getAttribute('data-index'), 10);
        setFormData((prevFormData) => {
            const itemList = prevFormData.itemList;
            itemList[index] = { ...itemList[index], [name]: value };
            return { ...prevFormData, itemList:itemList};
        });
    };

    
  
  // thinking to implement this
  const validateForm = () => {
    let isValid = true;
    const errors = {};

    // Seller Details Validation
    if (!formData.sellerDetails.name) {
      isValid = false;
      errors.sellerName = "Seller Name is required";
    }

    // Billing Details Validation
    if (!formData.billingDetails.name) {
      isValid = false;
      errors.billingName = "Billing Name is required";
    }

    // Item List Validation 
    if (formData.itemList.length === 0) {
      isValid = false;
      errors.itemList = "Please add at least one item";
    }

    // check quantity,amounts of items for validation
    formData.itemList.forEach((item, index) => {
        if (!item.description) {
            isValid = false;
            errors[`itemDescription${index}`] = "Item Description is required";
        }
        if (!item.unitPrice) {
            isValid = false;
            errors[`itemUnitPrice${index}`] = "Item Unit Price is required";
        }
        if (!item.quantity) {
            isValid = false;
            errors[`itemQuantity${index}`] = "Item Quantity is required";
        }
        if (!item.discount) {
            isValid = false;
            errors[`itemDiscount${index}`] = "Item Discount is required";
            
        }
        if (!item.taxRate) {
            isValid = false;
            errors[`itemTaxRate${index}`] = "Item Tax Rate is required";
        }
    });

    // Update state with validation errors 
    setFormData((prevFormData) => ({ ...prevFormData, errors }));
    
    return isValid;
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    handleMainFormData(formData);
  };

  // medium for error and submit
  const handleFormSubmit = (event) => {
    event.preventDefault();

    if (validateForm()) {
      handleSubmit(event); 
    } else {
      console.error("Form validation failed:", formData.errors);

      // alert errors
      if(formData.errors){
        const errorMessage = Object.values(formData.errors).join("\n - ");
        alert("Form Validation Errors:\n" + errorMessage);
      }
    }
  };
  return (
    <div className='container'>
        <h1>Invoice Form</h1>
        <form onSubmit={handleFormSubmit}>
        <div className="form-group">
            <span className='title'>Seller Details</span>
        <label>
                Seller Name:
                <input
                type="text"
                name="name"
                value={formData.sellerDetails.name}
                onChange={handleSellerChange}
                />
            </label>
            
            <Address address={formData.sellerDetails.address} handleChange={handleAddressSellerChange} />
            <label>
                Seller PAN:
                <input
                type="text"
                name="pan"
                value={formData.sellerDetails.pan}
                onChange={handleSellerChange}
                />
            </label>
            <label>
                Seller GST Registration No:
                <input
                type="text"
                name="gstRegistrationNo"
                value={formData.sellerDetails.gstRegistrationNo}
                onChange={handleSellerChange}
                />
            </label>
            </div>
            <div className="form-group">
                <span className='title'>Billing Details</span>
            <label>
                Billing Name:
                <input
                type="text"
                name="name"
                value={formData.billingDetails.name}
                onChange={handleBillingChange}
                />
            </label>
            
            <Address address={formData.billingDetails.address} handleChange={handleBillingAddressChange} />

            </div>
            <div className="form-group">
            <span className='title'>Shipping Details</span>
            <label>
                Shipping Name:
                <input
                type="text"
                name="name"
                value={formData.shippingDetails.name}
                onChange={handleShippingChange}
                />
            </label>
        
            <Address address={formData.shippingDetails.address} handleChange={handleShippingAddressChange} />
            </div>
            <div className="form-group">
            <span className='title'>Delivery and Supply Details</span>
            <label>
                Place of Delivery:
                <input
                type="text"
                name="placeOfDelivery"
                value={formData.placeOfDelivery}
                onChange={handleChange}
                />
            </label>
            <label>
                Place of Supply:
                <input
                type="text"
                name="placeOfSupply"
                value={formData.placeOfSupply}
                onChange={handleChange}
                />
            </label>
            </div>
            <div className="form-group">
            <span className='title'>Order Details</span>
            <label>
                Order No:
                <input
                type="text"
                name="orderNo"
                value={formData.orderSummary.orderNo}
                onChange={handleOrderChange}
                />
            </label>
            <label>
                Order Date:
                <input
                type="text"
                name="orderDate"
                value={formData.orderSummary.orderDate}
                onChange={handleOrderChange}
                />
            </label>
            </div>
            <div className="form-group">
            <span className='title'>Invoice Summary</span>
            <label>
                Invoice No:
                <input
                type="text"
                name="invoiceNo"
                value={formData.invoiceSummary.invoiceNo}
                onChange={handleInvoiceChange}
                />
            </label>
            <label>
                Invoice Details:
                <input
                type="text"
                name="invoiceDetails"
                value={formData.invoiceSummary.invoiceDetails}
                onChange={handleInvoiceChange}
                />
            </label>
            <label>
                Invoice Date:
                <input
                type="text"
                name="invoiceDate"
                value={formData.invoiceSummary.invoiceDate}
                onChange={handleInvoiceChange}
                />
            </label>
            </div>
            
            <div className='form-group'>
                <span className='title'>Item List</span>
                <ItemList itemList={formData.itemList} handleChange={handleItemChange} setFormData={setFormData} />
            </div>

            <div className="form-group">
                <span className='title'> Reverse Charge </span>
                <label>
                    Reverse Charge:
                    <select name="reverseCharge" className='' value={formData.reverseCharge} onChange={handleChange}>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                    </select>
                </label>
            </div>

        <button className='success' type="submit">Save Invoice</button>
        </form>
    </div>
  );
}

export default InvoiceForm;
