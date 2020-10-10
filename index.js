
const express=require('express');
const app=express();
const cors=require('cors');
const bodyParser=require('body-parser');
const knex=require('knex');
const jwt=require('jsonwebtoken');
const https=require('https');
const http=require('http');
const nodemailer=require('nodemailer');
const dateformat=require('dateformat');
const database=knex({
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: {
    rejectUnauthorized: false
  }
  }
});
app.use(bodyParser.json());
app.use(cors());
app.get('/',(req,res)=>
	{
		console.log('in')
		database.select('*').from('customer')
		.then(user=>res.send(user))
		.catch(err=>res.status(402).json(err))
			
	});
app.post('/login',(req,res)=>
	{
		const {email,password} = req.body;
		console.log('in'+email,password)
		database.select('*').from('logind').where('email','=',email)
		.then(data=>
			{
				console.log(data)
				const valid=password===jwt.verify(data[0].name,'spindle').password;
				console.log(valid)
				if (valid)
				{
					database.select('*').from('users').where('email','=',email)
					.then(user=>
					{	console.log(user)
						res.send(user[0]);					
					})
				}
				else
				{
					res.status(402).json('wrong password');
				}
			})
		.catch(err=>res.status(400).json('error occured'))		
	});
app.get('/transaction/:from/:to/:amt', (req, res)=>
	{
		const {from,to,amt} =req.params;
		var frombalance ,tobalance;
		console.log(from,to,amt);
		database.select('*').from('customer').where('email','=',from)
		.then(balance =>
		{
			console.log(balance)
			frombalance=balance[0].balance;	
		})
		.then(()=>
			database.select('*').from('customer').where('email','=',to)
			.then(balance =>
			{
				console.log(balance)
				tobalance=balance[0].balance;	
			})
			.catch(err=>
				{
					console.log(err);
					res.status(402).json('error in to')
			})
			)
		.then(()=>
		{
			if(frombalance>=amt)
			{
				database
				.insert(
				{
					frome:from,
					toe:to,
					amt:amt
				})
				.returning('*')
				.into('trn')
				.then(trn=>
				{
					increments(to,amt);
					decrements(from,amt);
					res.json(trn)
				})
				.catch(err=>res.status(402).json(err))
			}
		})
		.catch(err=>res.status(402).json(err))
	});

const createTable=(id)=>
	{
		const tablename='user'+id;
		database.select('*').from('users').where('id','=',parseInt(id))
		.then(user=>
		{
			if(user)
			{
				database.schema.createTable(tablename,(table)=>
				{
					table.increments('id');
					table.string('task');
					table.date('due');
				})
				.then(console.log('table created for'+user[0].name))
				.catch(err=>console.log(err))
			}
		})
	}
const getTransactions=(name,res)=>
{
	console.log(name);
	var tasks;
	database.select('*').from('trn').where('frome','=',name).orWhere('toe','=',name)
	.then(trn=>
	{
		console.log(trn)
		res.json(trn);
	})
}
const increments=(email,amt)=>
{
	var re;
	console.log(email,amt)
	database('customer')
	.where('email', '=', email)
	.increment(
	{
		balance: amt,
		nooftranscations: 1,
	})
	.returning('*')
	.then((u)=>
	{
		console.log('in',u[0].balance)
		re=u[0]
	})
	.catch(err=>{
		console.log(err)
		re=err
	})
	console.log('returned',re)
	return re;
}
const decrements=(email,amt)=>
{
	var re;
	console.log(email,amt)
	database('customer')
	.where('email', '=', email)
	.increment(
	{
		nooftranscations: 1,
	})
	.returning('*')
	.then((u)=>
	{
		console.log(u[0])
		database('customer')
		.where('email', '=', email)
		.decrement(
		{
			balance: amt,
		})
		.returning('*')
		.then((sec)=>
		{
			re=sec[0]
		})
		.catch(err=>console.log(err))
	})
	.catch(err=>{
		console.log(err)
		re=err
	})
	console.log('returned',re)
	return re;
}
app.get('/:email',(req,res)=>
{
	getTransactions(req.params.email,res)
})
app.post('/update',(req,res)=>
	{
		const {id,taskid,task,due}=req.body;
		const duemodified=due.slice(0,8)+(parseInt(due.slice(-2))+1)
		console.log('due'+duemodified)
		database('user'+id)
		  .where({ id: taskid })
		  .update({ task: task ,due:duemodified}, ['id', 'task','due'])
		  .then((u)=>
		{
			console.log(u)
			getTasks(id,res)
		})
	});
app.get('/trn',(req,res)=>
	{
		const name = req.body.name;
		console.log(name);
		getTasks(name,res);
	});

app.listen(process.env.PORT);
