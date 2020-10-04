
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
		database('customer').insert(
		{
			name:'angel',
			email:'angel@gmail.com',
			balance:'5000'
		})
		.returning('*')
		.then(user=>console.log(user))
		.then(()=>
			{
				console.log('ok')
				console.log(database)
		// res.json(database)
				database.select('*').from('customer')
				.then(user=>res.send(user))
				.catch(err=>res.status(402).json(err))
			})
		.catch(err=>res.status(500).json(err))
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
app.post('/register', (req, res)=>
	{
		const {from,to,amt} = req.body;
		database.transaction(trx=>
		{
		trx('transaction')
		.insert(
		{
			from:from,
			to:to,
			amt:amt
		})
		.returning('from')
		.then(name=>
		{
			
			return trx('users')
			.insert(
			{
				name:name,
				email:loginemail[0]
			})
			.returning('*')
			.then(user=>
			{
				console.log('logged in as '+user[0].name)
				if(user[0])
				{
					database.select('*').from('users').where('email','=',user[0].email)
					.then(usergot=>
					{
						// createTable(usergot[0].id)
						var id=usergot[0].id;
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
					})
					.catch(err=>Error('error'))
					res.json(user[0])
				}
			})
			.catch(err =>Error('error'))
		})
		.then(trx.commit)
		.catch(trx.rollback);
	})
		.catch(err=>res.status(400).json(err))
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
app.post('/transfer',(req,res)=>
	{
		const {from,to ,amt}=req.body;
		database.insert(
		{
			from:from,
			to:to,
			amt:amt
		})
		.returning('*')
		.into('transaction')
		.then(trnok=>
			{
				if(trnok)
					getTasks(from,res);
			})
		.catch(err=>console.log(err))
	});
const getTransactions=(name,res)=>
{
	var tasks;
	database.select('*').from('transaction').where('from','=',name).orWhere('to','=',name)
	.then(trn=>
	{
		console.log(trn)
		res.json(trn);
	})
}
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
