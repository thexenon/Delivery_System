import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import SignIn from './pages/SignIn';
import Category from './pages/Category';
import AddCategory from './pages/add-new/category';
import EditCategory from './pages/add-new/editcategory';
import Admin from './pages/Admin';
import AddAdmin from './pages/add-new/admin';
import EditAdmin from './pages/add-new/editadmin';
import Product from './pages/Product';
import AddProduct from './pages/add-new/product';
import ProductDetails from './pages/add-new/product-details';
import EditProduct from './pages/add-new/editproduct';
import Store from './pages/Store';
import AddStore from './pages/add-new/store';
import EditStore from './pages/add-new/editstore';
import StoreDetails from './pages/add-new/store-details';
import Review from './pages/Review';
import AddReview from './pages/add-new/review';
import EditReview from './pages/add-new/editreview';
import ReviewDetails from './pages/add-new/review-details';
import Order from './pages/Order';
import AddOrder from './pages/add-new/order';
import EditOrder from './pages/add-new/editorder';
import OrderDetails from './pages/add-new/order-details';
import OrderItem from './pages/OrderItem';
import OrderItemDetails from './pages/add-new/orderitem-details';
import Service from './pages/Service';
import AddService from './pages/add-new/service';
import EditService from './pages/add-new/editservice';
import ServiceDetails from './pages/add-new/service-details';
import Shop from './pages/Shop';
import AddShop from './pages/add-new/shop';
import EditShop from './pages/add-new/editshop';
import ShopDetails from './pages/add-new/shop-details';
import Request from './pages/Request';
import AddRequest from './pages/add-new/request';
import EditRequest from './pages/add-new/editrequest';
import RequestDetails from './pages/add-new/request-details';
import Rating from './pages/Rating';
import AddRating from './pages/add-new/rating';
import EditRating from './pages/add-new/editrating';
import RatingDetails from './pages/add-new/rating-details';

function SessionRedirector() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const hasToken = localStorage.getItem('token');
    if (hasToken && location.pathname === '/') {
      navigate('/dashboard', { replace: true });
    } else if (!hasToken && location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, [location, navigate]);
  return null;
}

function App() {
  return (
    <Router>
      <SessionRedirector />
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/category" element={<Category />} />
          <Route path="/add-new/category" element={<AddCategory />} />
          <Route path="/add-new/editcategory" element={<EditCategory />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/add-new/admin" element={<AddAdmin />} />
          <Route path="/add-new/editadmin" element={<EditAdmin />} />
          <Route path="/store" element={<Store />} />
          <Route path="/add-new/store" element={<AddStore />} />
          <Route path="/add-new/editstore" element={<EditStore />} />
          <Route path="/add-new/store-details" element={<StoreDetails />} />
          <Route path="/product" element={<Product />} />
          <Route path="/add-new/product" element={<AddProduct />} />
          <Route path="/add-new/editproduct" element={<EditProduct />} />
          <Route path="/add-new/product-details" element={<ProductDetails />} />
          <Route path="/review" element={<Review />} />
          <Route path="/add-new/review" element={<AddReview />} />
          <Route path="/add-new/editreview" element={<EditReview />} />
          <Route path="/add-new/review-details" element={<ReviewDetails />} />
          <Route path="/order" element={<Order />} />
          <Route path="/add-new/order" element={<AddOrder />} />
          <Route path="/add-new/editorder" element={<EditOrder />} />
          <Route path="/add-new/order-details" element={<OrderDetails />} />
          <Route path="/orderitem" element={<OrderItem />} />
          <Route
            path="/add-new/orderitem-details"
            element={<OrderItemDetails />}
          />
          <Route path="/service" element={<Service />} />
          <Route path="/add-new/service" element={<AddService />} />
          <Route path="/add-new/editservice" element={<EditService />} />
          <Route path="/add-new/service-details" element={<ServiceDetails />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/add-new/shop" element={<AddShop />} />
          <Route path="/add-new/editshop" element={<EditShop />} />
          <Route path="/add-new/shop-details" element={<ShopDetails />} />
          <Route path="/request" element={<Request />} />
          <Route path="/add-new/request" element={<AddRequest />} />
          <Route path="/add-new/editrequest" element={<EditRequest />} />
          <Route path="/add-new/request-details" element={<RequestDetails />} />
          <Route path="/rating" element={<Rating />} />
          <Route path="/add-new/rating" element={<AddRating />} />
          <Route path="/add-new/editrating" element={<EditRating />} />
          <Route path="/add-new/rating-details" element={<RatingDetails />} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
