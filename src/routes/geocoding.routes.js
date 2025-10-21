const { Router } = require('express');
const { autocomplete } = require('../controllers/geocoding.controller');

const router = Router();

router.get('/autocomplete', autocomplete);

module.exports = router;
