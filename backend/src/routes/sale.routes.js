import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Sales route' });
});

export default router;
