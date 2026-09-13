# Frequently Asked Questions

### Does ReWear handle payments?
No. ReWear is strictly a peer-to-peer item exchange platform. There is no monetary checkout or payment gateway integration.

### How does the value matching work?
When a user initiates a swap, the backend compares the `estimatedValue` of the requested item against the sum of the `estimatedValue` of the offered items. If the disparity is significant (e.g., trying to trade a $10 t-shirt for a $200 jacket), the system flags it.

### How are images stored?
Images are not stored in the MongoDB database. They are uploaded to Cloudinary via the backend using Multer. MongoDB only stores the resulting secure URLs.

### Why do some routes return 401 Unauthorized during development?
Ensure you have logged in to the application and that your browser is successfully storing the `jwt` HttpOnly cookie. Since it is HttpOnly, you cannot inspect it via `localStorage`. Check the Network tab or Application > Cookies in your browser DevTools.

### Can a user accept a swap if their item is already traded?
No. Once a swap is accepted, the status of the involved listings changes from `available` to `pending` or `swapped`. Backend controllers enforce state machines that prevent items from being traded twice.

### How do I access the Admin Dashboard?
You must log in with an account that has `role: 'admin'`. Run `npm run seed:admin` locally to generate an admin account, then log in with those credentials.
