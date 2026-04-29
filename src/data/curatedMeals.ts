export type CuratedMeal = {
  id: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  tags: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  timeToMakeMinutes: number;
  mealPrepFriendly: boolean;
  description: string;
  ingredients: string[];
  instructions: string[];
  storageNotes: string;
  reheatingNotes?: string;
  groceryNotes?: string[];
};

const meal = (
  id: string,
  name: string,
  category: CuratedMeal['category'],
  tags: string[],
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  servingSize: string,
  timeToMakeMinutes: number,
  mealPrepFriendly: boolean,
  description: string,
  ingredients: string[],
  instructions: string[],
  storageNotes: string,
  reheatingNotes?: string,
  groceryNotes?: string[]
): CuratedMeal => ({ id, name, category, tags: Array.from(new Set([...tags, category])), calories, protein, carbs, fat, servingSize, timeToMakeMinutes, mealPrepFriendly, description, ingredients, instructions, storageNotes, reheatingNotes, groceryNotes });

export function curatedMealNotes(meal: CuratedMeal) {
  return [
    meal.description,
    `Serving size: ${meal.servingSize}.`,
    `Macros: ${meal.calories} calories, ${meal.protein}g protein, ${meal.carbs}g carbs, ${meal.fat}g fat.`,
    `Ingredients: ${meal.ingredients.join('; ')}.`,
    `Instructions: ${meal.instructions.map((step, index) => `${index + 1}. ${step}`).join(' ')}`,
    `Storage: ${meal.storageNotes}.`,
    meal.reheatingNotes ? `Reheating: ${meal.reheatingNotes}.` : '',
    meal.groceryNotes?.length ? `Grocery notes: ${meal.groceryNotes.join('; ')}.` : '',
  ].filter(Boolean).join('\n\n');
}

export function curatedMealToAppMeal(meal: CuratedMeal, idPrefix = 'curated') {
  const typeMap = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' } as const;
  return {
    id: `${idPrefix}-${meal.id}`,
    name: meal.name,
    type: typeMap[meal.category],
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    notes: curatedMealNotes(meal),
    custom: true,
  };
}

export const curatedMeals: CuratedMeal[] = [
  meal('protein-overnight-oats','Overnight oats (protein version)','breakfast',['high-protein','quick','meal-prep','pre-workout'],430,36,55,9,'1 jar',10,true,'Cold oats with whey and berries for a high-carb, high-protein start.',['50g rolled oats','1 scoop vanilla whey','170g nonfat Greek yogurt','120ml unsweetened almond milk','75g blueberries','8g chia seeds'],['Stir oats, whey, yogurt, milk, and chia in a jar.','Fold in blueberries.','Refrigerate at least 4 hours.'], 'Keep refrigerated up to 4 days. Add berries day-of for best texture.', undefined, ['Use certified gluten-free oats if needed.']),
  meal('greek-yogurt-berries-granola','Greek yogurt + berries + granola','breakfast',['high-protein','quick','no-cook','low-calorie'],360,32,42,8,'1 bowl',5,false,'Creamy yogurt bowl with measured granola for crunch.',['250g nonfat Greek yogurt','100g mixed berries','30g low-sugar granola','10g honey'],['Add yogurt to bowl.','Top with berries, granola, and honey.','Serve cold.'],'Best assembled fresh. Keep ingredients separate up to 5 days.'),
  meal('eggs-avocado-toast','Eggs + avocado toast','breakfast',['comfort','breakfast'],480,28,38,24,'2 eggs + 1 toast plate',12,false,'Classic eggs and toast with measured avocado.',['2 large eggs','1 slice sourdough bread','60g avocado','100g egg whites','Salt, pepper, chili flakes'],['Toast bread.','Cook eggs and egg whites in a nonstick pan over medium heat for 3-5 minutes.','Mash avocado on toast and serve with eggs.'],'Cook eggs fresh. Store avocado with lime juice up to 1 day.'),
  meal('egg-whites-turkey-bacon','Egg whites + turkey bacon','breakfast',['high-protein','quick','low-calorie','turkey'],300,38,12,9,'1 plate',10,false,'Lean breakfast plate with turkey bacon and fruit.',['250g liquid egg whites','2 slices turkey bacon','1 slice whole-grain toast','80g strawberries'],['Cook turkey bacon in skillet over medium heat for 4-6 minutes.','Scramble egg whites in the same pan.','Serve with toast and strawberries.'],'Egg whites are best fresh. Cooked turkey bacon keeps 3 days.'),
  meal('protein-pancakes','Protein pancakes','breakfast',['high-protein','comfort','pre-workout'],455,39,50,10,'4 pancakes',18,true,'Fluffy protein pancakes with controlled syrup.',['40g oat flour','1 scoop vanilla whey','1 egg','80g banana','80ml almond milk','5g baking powder','20ml sugar-free syrup'],['Blend batter until smooth.','Cook 1/4-cup pancakes on medium-low heat for 2-3 minutes per side.','Top with syrup.'],'Refrigerate pancakes up to 3 days or freeze up to 2 months.', 'Microwave 30-45 seconds or toast from thawed.'),
  meal('banana-pb-protein-smoothie','Protein smoothie (banana + PB)','breakfast',['high-protein','quick','pre-workout'],410,34,44,12,'1 smoothie',5,false,'Fast shake with banana carbs and measured peanut butter.',['1 scoop whey protein','1 medium banana','16g peanut butter','240ml skim milk','100g ice'],['Blend all ingredients until smooth.','Drink immediately.'],'Best fresh. Freeze banana portions for faster prep.', undefined, ['Use powdered peanut butter to reduce fat.']),
  meal('cottage-cheese-fruit','Cottage cheese + fruit','breakfast',['high-protein','quick','no-cook','low-calorie'],310,30,35,5,'1 bowl',5,false,'High-protein no-cook breakfast with fruit.',['250g low-fat cottage cheese','150g pineapple','10g honey','10g chopped walnuts'],['Spoon cottage cheese into bowl.','Add pineapple, honey, and walnuts.'],'Keep cottage cheese sealed; assemble fresh.'),
  meal('egg-chicken-breakfast-burrito','Breakfast burrito (egg + chicken)','breakfast',['high-protein','chicken','meal-prep','comfort'],520,42,48,17,'1 burrito',20,true,'Freezer-friendly breakfast burrito with chicken and eggs.',['1 large flour tortilla','2 eggs','85g cooked chicken breast','30g reduced-fat cheese','60g salsa','50g peppers'],['Scramble eggs over medium heat.','Warm chicken and peppers.','Fill tortilla with eggs, chicken, cheese, and salsa, then roll tightly.'],'Wrap in foil and refrigerate 3 days or freeze 2 months.', 'Microwave thawed burrito 90 seconds, then crisp in pan 2 minutes per side.'),
  meal('oatmeal-whey','Oatmeal + whey protein','breakfast',['high-protein','quick','pre-workout'],390,34,52,6,'1 bowl',7,false,'Hot oats with whey stirred in after cooking.',['55g rolled oats','1 scoop whey','240ml water','80g banana','5g cinnamon'],['Microwave oats with water 2-3 minutes.','Let cool 1 minute.','Stir in whey and top with banana/cinnamon.'],'Best fresh. Portion dry oats and whey separately.'),
  meal('bagel-eggs-turkey','Bagel + eggs + turkey','breakfast',['high-protein','turkey','pre-workout'],540,39,62,14,'1 sandwich',12,false,'High-carb breakfast sandwich for training days.',['1 plain bagel','2 eggs','60g sliced turkey breast','15g light cream cheese'],['Toast bagel.','Cook eggs over medium heat.','Layer turkey, eggs, and cream cheese.'],'Cook fresh. Keep turkey sealed up to 5 days.'),
  meal('chia-pudding','Chia pudding','breakfast',['quick','meal-prep','no-cook','dairy-free-option'],340,22,34,14,'1 jar',10,true,'Make-ahead chia pudding with protein powder.',['28g chia seeds','1 scoop vanilla plant protein','240ml almond milk','80g berries','5g maple syrup'],['Whisk chia, protein, milk, and syrup.','Refrigerate 4 hours, stirring once after 20 minutes.','Top with berries.'],'Refrigerate up to 4 days.'),
  meal('smoothie-bowl','Smoothie bowl','breakfast',['high-protein','pre-workout'],450,31,65,8,'1 bowl',8,false,'Thick smoothie bowl with fruit and granola.',['1 scoop whey','150g frozen berries','100g banana','120g Greek yogurt','25g granola'],['Blend whey, berries, banana, and yogurt thick.','Pour into bowl and top with granola.'],'Best fresh. Freeze fruit packs ahead.'),
  meal('egg-muffins','Egg muffins (meal prep)','breakfast',['high-protein','meal-prep','low-calorie'],315,34,10,14,'4 muffins',30,true,'Portable egg muffins with turkey and vegetables.',['300g egg whites','2 whole eggs','90g diced turkey breast','60g spinach','40g reduced-fat cheese'],['Heat oven to 350F.','Mix ingredients and divide into muffin tin.','Bake 18-22 minutes until set.'],'Refrigerate up to 4 days.', 'Microwave 30-45 seconds.'),
  meal('yogurt-parfait','Yogurt parfait','breakfast',['high-protein','quick','no-cook'],385,31,48,8,'1 parfait',6,false,'Layered yogurt, fruit, and cereal-style crunch.',['230g nonfat Greek yogurt','100g strawberries','35g high-protein cereal','10g honey'],['Layer yogurt, strawberries, cereal, and honey in a glass.','Serve cold.'],'Keep cereal separate until eating to preserve crunch.'),
  meal('pb-banana-toast','Toast + peanut butter + banana','breakfast',['quick','pre-workout','comfort'],390,16,55,13,'2 slices toast',6,false,'Simple carb-forward toast for light training mornings.',['2 slices whole-grain bread','24g peanut butter','1 medium banana','5g cinnamon'],['Toast bread.','Spread measured peanut butter.','Top with banana slices and cinnamon.'],'Best fresh. Use powdered peanut butter for lower calories.'),

  meal('chicken-rice-broccoli','Chicken + rice + broccoli','lunch',['high-protein','meal-prep','chicken','rice-bowl','post-workout'],560,52,58,11,'1 bowl',30,true,'Classic lean meal prep bowl.',['170g cooked chicken breast','185g cooked jasmine rice','150g broccoli','10g olive oil','15g teriyaki sauce'],['Season chicken and cook in skillet over medium-high heat to 165F.','Steam broccoli 4-5 minutes.','Portion with cooked rice, oil, and sauce.'],'Refrigerate up to 4 days.', 'Microwave 2-3 minutes until hot.'),
  meal('chipotle-style-chicken-bowl','Chipotle-style chicken bowl','lunch',['high-protein','chicken','rice-bowl','comfort'],650,50,72,18,'1 bowl',25,true,'Homemade burrito bowl without restaurant uncertainty.',['160g cooked chicken breast','180g cooked rice','90g black beans','60g corn salsa','40g avocado','30g shredded lettuce'],['Cook seasoned chicken to 165F.','Warm rice and beans.','Assemble with salsa, avocado, and lettuce.'],'Store components separately up to 4 days.', 'Microwave rice, beans, and chicken only.'),
  meal('turkey-avocado-sandwich','Turkey sandwich + avocado','lunch',['turkey','quick'],520,38,48,20,'1 sandwich',8,false,'Simple deli-style sandwich with measured avocado.',['2 slices whole-grain bread','120g sliced turkey breast','50g avocado','20g light mayo','Tomato and lettuce'],['Toast bread if desired.','Layer turkey, avocado, mayo, tomato, and lettuce.'],'Best fresh. Keep wet ingredients separate for packed lunch.'),
  meal('chicken-caesar-wrap','Chicken Caesar wrap','lunch',['high-protein','chicken','quick'],540,47,45,18,'1 wrap',12,false,'High-protein Caesar wrap with lighter dressing.',['1 large tortilla','150g cooked chicken breast','55g romaine','25g parmesan','30g light Caesar dressing'],['Warm tortilla.','Toss chicken, romaine, parmesan, and dressing.','Wrap tightly.'],'Wrap in foil and refrigerate up to 1 day.'),
  meal('salmon-poke-bowl','Salmon poke bowl','lunch',['seafood','rice-bowl','post-workout'],610,40,68,20,'1 bowl',20,false,'Cooked salmon poke-inspired bowl.',['140g cooked salmon','180g cooked sushi rice','80g cucumber','60g edamame','15ml low-sodium soy sauce','5g sesame seeds'],['Bake salmon at 400F for 10-12 minutes to 145F.','Assemble with rice, cucumber, edamame, soy sauce, and sesame.'],'Refrigerate cooked salmon up to 3 days.', 'Eat cold or microwave rice separately.'),
  meal('ground-beef-rice-bowl','Ground beef + rice bowl','lunch',['beef','rice-bowl','meal-prep'],640,43,58,26,'1 bowl',22,true,'Lean ground beef bowl with rice and peppers.',['150g cooked 93/7 ground beef','180g cooked rice','120g peppers/onions','30g salsa','15g reduced-fat cheese'],['Brown beef to 160F.','Saute peppers and onions.','Portion with rice, salsa, and cheese.'],'Refrigerate up to 4 days.', 'Microwave 2 minutes, stir halfway.'),
  meal('light-chicken-pasta','Chicken pasta (light sauce)','lunch',['high-protein','chicken','pasta','comfort'],620,50,72,13,'1 bowl',25,true,'Pasta bowl with lean chicken and light sauce.',['150g cooked chicken breast','75g dry penne','125g marinara','15g parmesan','100g zucchini'],['Boil pasta until al dente.','Cook chicken to 165F.','Simmer marinara with zucchini and combine.'],'Refrigerate up to 4 days.', 'Microwave with a splash of water.'),
  meal('shrimp-rice-bowl','Shrimp rice bowl','lunch',['seafood','quick','rice-bowl','low-calorie'],500,42,62,8,'1 bowl',15,false,'Fast shrimp rice bowl with vegetables.',['170g shrimp','180g cooked rice','150g stir-fry vegetables','15ml soy sauce','5g sesame oil'],['Cook shrimp in skillet 2-3 minutes per side to opaque.','Stir-fry vegetables.','Serve over rice with soy sauce and sesame oil.'],'Refrigerate up to 2 days.', 'Reheat gently to avoid rubbery shrimp.'),
  meal('steak-potatoes-lunch','Steak + potatoes','lunch',['high-protein','beef','comfort'],650,48,55,24,'1 plate',30,true,'Lean steak with roasted potatoes.',['170g sirloin','280g potato','150g green beans','10g olive oil'],['Roast diced potatoes at 425F for 25 minutes.','Sear steak 3-5 minutes per side to desired doneness.','Steam green beans.'],'Refrigerate up to 4 days.', 'Reheat potatoes in air fryer; warm steak gently.'),
  meal('tuna-sandwich','Tuna sandwich','lunch',['high-protein','quick','seafood'],430,39,38,12,'1 sandwich',8,false,'Light tuna sandwich with Greek-yogurt dressing.',['1 can tuna in water, drained','2 slices whole-grain bread','35g Greek yogurt','10g light mayo','Celery, pickles, mustard'],['Mix tuna with yogurt, mayo, celery, pickles, and mustard.','Assemble sandwich.'],'Tuna salad keeps refrigerated up to 2 days.'),
  meal('chicken-salad-bowl','Chicken salad bowl','lunch',['high-protein','chicken','low-calorie'],460,48,25,18,'1 salad',15,false,'Big salad with chicken and measured dressing.',['170g cooked chicken breast','90g mixed greens','100g cucumber/tomato','35g avocado','30g light vinaigrette','25g croutons'],['Slice chicken.','Add vegetables to bowl.','Top with chicken, avocado, croutons, and dressing.'],'Keep dressing separate until eating.'),
  meal('homemade-burrito-bowl','Burrito bowl','lunch',['rice-bowl','high-protein','meal-prep'],620,46,70,16,'1 bowl',25,true,'Balanced burrito bowl with turkey and beans.',['150g cooked 93/7 ground turkey','170g cooked rice','90g pinto beans','60g salsa','30g light cheese'],['Brown turkey to 165F.','Warm rice and beans.','Assemble with salsa and cheese.'],'Refrigerate up to 4 days.', 'Microwave 2-3 minutes.'),
  meal('homemade-sushi-rolls','Sushi rolls','lunch',['seafood','pre-workout'],520,32,82,8,'2 rolls',35,false,'Homemade cooked shrimp sushi rolls.',['2 nori sheets','200g cooked sushi rice','120g cooked shrimp','60g cucumber','40g avocado','Soy sauce'],['Spread rice on nori.','Add shrimp, cucumber, and avocado.','Roll tightly and slice.'],'Best fresh. Keep refrigerated and eat within 24 hours.'),
  meal('turkey-wrap','Turkey wrap','lunch',['turkey','quick','low-calorie'],420,36,40,12,'1 wrap',7,false,'Lean turkey wrap for fast lunches.',['1 high-fiber tortilla','120g turkey breast','30g hummus','50g spinach','40g tomato'],['Spread hummus on tortilla.','Layer turkey and vegetables.','Roll tightly.'],'Wrap in foil and refrigerate up to 1 day.'),
  meal('egg-salad-sandwich','Egg salad sandwich','lunch',['comfort','quick'],470,28,40,22,'1 sandwich',15,true,'Higher-protein egg salad with Greek yogurt.',['2 hard-boiled eggs','100g egg whites, chopped','35g Greek yogurt','10g light mayo','2 slices whole-grain bread'],['Chop eggs and egg whites.','Mix with yogurt, mayo, mustard, salt, and pepper.','Assemble sandwich.'],'Egg salad keeps refrigerated up to 3 days.'),

  meal('dinner-steak-potatoes-veggies','Steak + potatoes + veggies','dinner',['high-protein','beef','comfort'],720,55,60,28,'1 plate',35,true,'Satisfying steak dinner with measured potatoes.',['200g sirloin','300g potatoes','180g asparagus','10g olive oil'],['Roast potatoes at 425F for 25-30 minutes.','Sear steak to desired doneness.','Roast asparagus 8-10 minutes.'],'Refrigerate up to 4 days.', 'Air fry potatoes; warm steak gently.'),
  meal('salmon-asparagus-rice','Salmon + asparagus + rice','dinner',['seafood','rice-bowl','post-workout'],650,44,58,26,'1 plate',25,true,'Salmon dinner with rice and asparagus.',['170g salmon fillet','170g cooked rice','180g asparagus','5g olive oil','Lemon and dill'],['Bake salmon at 400F for 10-12 minutes to 145F.','Roast asparagus 8 minutes.','Serve with rice.'],'Refrigerate up to 3 days.', 'Reheat gently or eat salmon cold.'),
  meal('chicken-stir-fry','Chicken stir fry','dinner',['high-protein','chicken','quick','rice-bowl'],590,52,62,12,'1 bowl',20,true,'Lean chicken stir fry with rice.',['170g chicken breast','180g cooked rice','200g stir-fry vegetables','20g teriyaki sauce','5g sesame oil'],['Cook chicken to 165F.','Stir-fry vegetables over high heat.','Add sauce and serve over rice.'],'Refrigerate up to 4 days.', 'Microwave or reheat in skillet.'),
  meal('taco-bowl','Taco bowl','dinner',['beef','rice-bowl','comfort'],670,45,64,24,'1 bowl',25,true,'Taco bowl with lean beef and beans.',['160g cooked 93/7 beef','160g cooked rice','90g black beans','60g salsa','30g light cheese','40g avocado'],['Brown beef with taco seasoning to 160F.','Warm rice and beans.','Top with salsa, cheese, and avocado.'],'Refrigerate beef/rice/beans up to 4 days.'),
  meal('lighter-chicken-alfredo','Chicken Alfredo (lighter)','dinner',['high-protein','chicken','pasta','comfort'],690,56,76,16,'1 bowl',30,true,'Creamy pasta using a lighter sauce.',['170g chicken breast','85g dry fettuccine','90g light Alfredo sauce','100g broccoli','15g parmesan'],['Boil pasta.','Cook chicken to 165F.','Steam broccoli and toss all with sauce.'],'Refrigerate up to 4 days.', 'Reheat with splash of milk or water.'),
  meal('ground-turkey-rice','Ground turkey + rice','dinner',['turkey','rice-bowl','meal-prep'],610,48,60,17,'1 bowl',22,true,'Simple turkey rice bowl.',['170g cooked 93/7 ground turkey','180g cooked rice','150g zucchini','30g salsa'],['Brown turkey to 165F.','Saute zucchini.','Portion with rice and salsa.'],'Refrigerate up to 4 days.'),
  meal('bbq-chicken-sweet-potato','BBQ chicken + sweet potato','dinner',['chicken','meal-prep','comfort'],620,52,68,10,'1 plate',35,true,'BBQ chicken plate with sweet potato.',['180g chicken breast','300g sweet potato','150g green beans','35g BBQ sauce'],['Bake sweet potato at 425F for 35-45 minutes.','Cook chicken to 165F and brush with BBQ sauce.','Steam green beans.'],'Refrigerate up to 4 days.'),
  meal('shrimp-pasta','Shrimp pasta','dinner',['seafood','pasta','quick'],600,45,78,10,'1 bowl',20,false,'Light shrimp pasta with marinara.',['170g shrimp','85g dry spaghetti','150g marinara','100g spinach','10g parmesan'],['Boil pasta.','Cook shrimp until opaque.','Warm marinara with spinach and toss together.'],'Refrigerate up to 2 days.', 'Reheat gently.'),
  meal('chicken-fajitas','Chicken fajitas','dinner',['chicken','quick','comfort'],610,50,58,16,'3 fajitas',25,true,'Chicken fajitas with measured tortillas.',['170g chicken breast','3 corn tortillas','180g peppers/onions','40g avocado','60g salsa'],['Cook sliced chicken to 165F.','Saute peppers and onions.','Serve in tortillas with avocado and salsa.'],'Store filling up to 4 days.'),
  meal('sushi-night','Sushi night','dinner',['seafood','pre-workout'],640,38,92,12,'3 homemade rolls',40,false,'Homemade sushi dinner with cooked fish/shrimp.',['3 nori sheets','280g cooked sushi rice','150g cooked shrimp','80g cucumber','50g avocado','Soy sauce'],['Prepare sushi rice.','Fill nori with rice, shrimp, cucumber, and avocado.','Roll and slice.'],'Best fresh; eat within 24 hours.'),
  meal('thai-noodles-chicken','Thai noodles + chicken','dinner',['chicken','pasta','comfort'],700,50,88,16,'1 bowl',25,false,'Thai-inspired noodle bowl with measured sauce.',['170g chicken breast','90g dry rice noodles','150g vegetables','25g peanut sauce','15ml soy sauce'],['Cook noodles.','Cook chicken to 165F.','Stir-fry vegetables and toss with sauce.'],'Refrigerate up to 3 days.', 'Reheat in skillet with splash of water.'),
  meal('high-protein-burger','Burger (high protein version)','dinner',['beef','comfort','high-protein'],650,50,48,26,'1 burger plate',20,false,'Lean burger with high-protein sides.',['170g 93/7 beef patty','1 brioche bun','20g light burger sauce','30g reduced-fat cheese','150g air-fried potatoes'],['Form patty and cook to 160F.','Toast bun.','Air fry potatoes at 400F for 15-18 minutes.'],'Best fresh. Cooked patty keeps 3 days.'),
  meal('lighter-chicken-parmesan','Chicken parmesan (lighter)','dinner',['chicken','comfort','high-protein'],640,58,55,16,'1 plate',35,true,'Baked chicken parmesan with controlled breading.',['180g chicken breast','25g panko','125g marinara','30g mozzarella','65g dry pasta'],['Heat oven to 400F.','Coat chicken with panko and bake to 165F.','Top with marinara and cheese, then melt.','Serve with pasta.'],'Refrigerate up to 4 days.', 'Reheat in oven or air fryer for best texture.'),
  meal('teriyaki-chicken-bowl','Teriyaki chicken bowl','dinner',['chicken','rice-bowl','post-workout'],630,52,78,10,'1 bowl',25,true,'Carb-forward teriyaki bowl for training days.',['180g chicken breast','220g cooked rice','160g broccoli','35g teriyaki sauce','5g sesame seeds'],['Cook chicken to 165F.','Steam broccoli.','Serve over rice with teriyaki and sesame.'],'Refrigerate up to 4 days.'),
  meal('beef-broccoli','Beef + broccoli','dinner',['beef','rice-bowl','high-protein'],660,48,58,24,'1 bowl',25,true,'Lean beef and broccoli with rice.',['170g flank steak','180g cooked rice','200g broccoli','25g stir-fry sauce','5g sesame oil'],['Slice beef thin and sear over high heat.','Steam broccoli.','Toss with sauce and serve over rice.'],'Refrigerate up to 4 days.', 'Reheat in skillet or microwave.'),

  meal('protein-bar','Protein bars','snack',['snack','high-protein','quick','no-cook'],220,20,22,7,'1 bar',1,false,'Packaged protein bar for emergencies.',['1 protein bar, about 55-65g'],['Open and eat.','Log label if different from estimate.'],'Store at room temperature.'),
  meal('rice-cakes-pb','Rice cakes + peanut butter','snack',['snack','quick','pre-workout'],230,8,28,10,'2 rice cakes',3,false,'Crunchy carb snack with measured peanut butter.',['2 plain rice cakes','20g peanut butter','5g honey'],['Spread peanut butter on rice cakes.','Drizzle honey.'],'Best fresh.'),
  meal('snack-greek-yogurt','Greek yogurt','snack',['snack','high-protein','quick','no-cook','low-calorie'],180,25,12,2,'1 cup',2,false,'Simple high-protein snack.',['200g nonfat Greek yogurt','5g honey or cinnamon'],['Stir and eat cold.'],'Keep refrigerated.'),
  meal('fruit-peanut-butter','Fruit + peanut butter','snack',['snack','quick','pre-workout'],250,7,32,11,'1 apple + PB',3,false,'Fruit snack with measured fat.',['1 medium apple','20g peanut butter'],['Slice apple.','Serve with measured peanut butter.'],'Best fresh.'),
  meal('beef-jerky','Beef jerky','snack',['snack','high-protein','quick','no-cook','beef'],160,24,8,3,'50g jerky',1,false,'Shelf-stable lean protein.',['50g lower-sugar beef jerky'],['Open and eat.','Drink water; jerky is high sodium.'],'Store sealed at room temperature.'),
  meal('snack-cottage-cheese','Cottage cheese','snack',['snack','high-protein','quick','low-calorie'],210,28,14,4,'1 bowl',3,false,'Cottage cheese snack with fruit.',['200g low-fat cottage cheese','80g berries'],['Add cottage cheese to bowl.','Top with berries.'],'Keep refrigerated.'),
  meal('protein-shake','Protein shake','snack',['snack','high-protein','quick','post-workout'],170,30,5,3,'1 shake',2,false,'Fast post-workout protein.',['1 scoop whey protein','300ml water or almond milk'],['Shake with cold liquid until smooth.'],'Store protein powder dry. Drink immediately.'),
  meal('trail-mix','Trail mix','snack',['snack','quick','comfort'],300,9,26,18,'45g portion',2,false,'Measured trail mix portion.',['45g trail mix with nuts and dried fruit'],['Weigh one serving.','Do not eat from the bag.'],'Store sealed at room temperature.'),
  meal('low-cal-popcorn','Popcorn (low cal)','snack',['snack','low-calorie','quick'],120,4,24,2,'1 large bowl',4,false,'High-volume low-calorie snack.',['30g popcorn kernels or 1 light microwave bag','Salt'],['Air pop kernels or microwave bag.','Season lightly.'],'Store kernels dry. Eat popped popcorn fresh.'),
  meal('string-cheese','String cheese','snack',['snack','quick','low-calorie'],160,14,2,10,'2 sticks',1,false,'Simple portioned cheese snack.',['2 part-skim string cheese sticks'],['Open and eat.'],'Keep refrigerated.'),
  meal('hard-boiled-eggs','Hard boiled eggs','snack',['snack','high-protein','meal-prep','low-calorie'],155,13,1,11,'2 eggs',12,true,'Portable cooked eggs.',['2 large eggs','Salt and pepper'],['Boil eggs 10-11 minutes.','Cool in ice bath and peel if desired.'],'Refrigerate unpeeled up to 7 days.'),
  meal('snack-smoothie','Smoothies','snack',['snack','quick','pre-workout'],280,24,42,3,'1 smoothie',5,false,'Light fruit protein smoothie.',['1 scoop whey','150g frozen fruit','240ml almond milk','50g banana'],['Blend until smooth.'],'Best fresh. Freeze fruit packs.'),
  meal('granola-bar','Granola bars','snack',['snack','quick','pre-workout'],190,6,30,6,'1 bar',1,false,'Carb-forward convenience snack.',['1 granola bar, about 40g'],['Open and eat.','Pair with protein if used as a meal bridge.'],'Store at room temperature.'),
  meal('dark-chocolate-almonds','Dark chocolate + almonds','snack',['snack','comfort'],240,6,18,17,'20g almonds + 15g chocolate',2,false,'Measured sweet snack.',['20g almonds','15g dark chocolate'],['Weigh portions.','Eat slowly as a planned snack.'],'Store sealed at room temperature.'),
];
