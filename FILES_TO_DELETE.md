

## ✅ Safe to Delete - Documentation Files (Optional)

### Old Documentation (May be outdated):
- `DATA_ISOLATION_FIX.md` - Old documentation
- `DATA_ISOLATION_FIX_COMPLETE.md` - Old documentation
- `REVIEW_SYSTEM_SETUP.md` - Setup instructions (can delete after setup)
- `REVIEWS_SYSTEM_README.md` - Documentation (can delete if not needed)
- `SETUP_INSTRUCTIONS.md` - Setup instructions (can delete after setup)

**Note:** These are just documentation - safe to delete but might be useful for reference.

## ❌ DO NOT DELETE - Active Files

### Currently Used PHP Files:
- ✅ `jbr7php/submit_review_new.php` - **ACTIVE** - Used for submitting reviews
- ✅ `jbr7php/get_product_reviews.php` - **ACTIVE** - Used to fetch reviews
- ✅ `jbr7php/get_user_reviews.php` - **ACTIVE** - Used in profile page
- ✅ `jbr7php/get_items.php` - **ACTIVE** - Used in explore page
- ✅ `jbr7php/signin.php` - **ACTIVE** - Login
- ✅ `jbr7php/signup.php` - **ACTIVE** - Registration
- ✅ `jbr7php/save_order.php` - **ACTIVE** - Order saving
- ✅ `jbr7php/get_orders.php` - **ACTIVE** - Order fetching
- ✅ All other PHP files in jbr7php/ - Check usage before deleting

### SQL Files to Keep:
- ✅ `SQL/FULL_SQL_CODE.sql` - **KEEP** - Main database schema
- ✅ `SQL/fix_reviews_simple.sql` - **KEEP** - Latest migration (if not run yet)

## 📋 Quick Delete Checklist

### Immediate Safe Deletes (Test/Debug):
```
jbr7php/test_review_content.php
jbr7php/test_reviews.php
jbr7php/debug_reviews.php
```

### After Verifying They're Not Used:
```
jbr7php/submit_review.php (old version)
jbr7php/get_reviews.php (old version)
jbr7php/get_product_reviews_new.php (duplicate)
```

### After Running Migrations:
```
SQL/fix_reviews_table.sql
SQL/fix_reviews_table_safe.sql
SQL/reviews_new.sql (if FULL_SQL_CODE.sql is used)
```

### Optional (Documentation):
```
DATA_ISOLATION_FIX.md
DATA_ISOLATION_FIX_COMPLETE.md
REVIEW_SYSTEM_SETUP.md
REVIEWS_SYSTEM_README.md
SETUP_INSTRUCTIONS.md
```

## 🔍 How to Verify Before Deleting

1. **Check if file is referenced:**
   - Search for filename in all HTML/JS files
   - Check browser console for 404 errors
   - Check server logs

2. **Test after deletion:**
   - Test review submission
   - Test review display
   - Test explore page ratings
   - Test profile page reviews

3. **Keep backups:**
   - Copy files to a backup folder before deleting
   - Or use git to track changes
