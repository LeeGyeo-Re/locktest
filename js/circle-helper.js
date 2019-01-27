(function(tau) {
	var data = {
			id : 0,
			password : "좌좌좌좌"
		};
	var DB_VERSION = 5,
	DB_NAME = "lock", 
	DB_DISPLAY_NAME = "lockPass",
	DB_SIZE = 2 * 1024 * 1024,
	DB_TABLE_NAME = "password",
	db, dbType = "none",
	pageList = ["main", "setting-popup"],
	pageNow = "setting-popup",
	dataTypeList = ["id", "password"];
	var idbObjectStore, resultDiv, direction, pass = "", password, 
	leftButton,rightButton,temp = "",prepass,left,right, setpass, cancel,
	

	rotaryDetentHandler = function(e) {
		/* Get rotary direction */
		direction = e.detail.direction;
		
		if (direction === "CW") {
			pass = pass + "우";
			if (pass === data.password) {
				document.getElementById("blockBTN").style.display = "block";
				resultDiv.innerHTML = "";
				pass = "";
			}
			if((pass.length === data.password.length)&&(pass !== data.password)){
				pass = "";
				changePage("failPass");
				
			}
			
			
		} else if (direction === "CCW") {
			/* Left direction */
			pass = pass + "좌";
			if (pass === data.password) {
				document.getElementById("blockBTN").style.display = "block";
				resultDiv.innerHTML = "";
				pass = "";
			}
			if((pass.length === data.password.length)&&(pass !== data.password)){
				pass = "";
				changePage("failPass");
				
			}
			
		}

		resultDiv.innerText = pass + " " + data.password;
		
	};
	function onSuccess(e) {
	    console.log("Success : " + e.message);
	}

	function onError(e) {
	    console.warn("Error : " + e.message);
	}
	
	
	function changePage(destPage) {
	    var i,
	        objPage;

	    for (i = 0; i < pageList.length; i++) {
	        objPage = document.querySelector("#" + pageList[i]);
	        objPage.style.display = "none";
	    }

	    document.querySelector("#" + destPage).style.display = "block";
	    pageNow = destPage;
	}

	function createTable(db) {
		if (dbType === "IDB") {
			if (db.objectStoreNames.contains(DB_TABLE_NAME)) {
				db.deleteObjectStore(DB_TABLE_NAME);
			}

			idbObjectStore = db.createObjectStore(DB_TABLE_NAME, {
				keyPath : "id",
				autoIncrement : true
			});
		} else if (dbType === "SQL") {
			db.transaction(function(t) {
				t.executeSql("CREATE TABLE if not exists " + DB_TABLE_NAME + " (id INTEGER PRIMARY KEY, passowrd TEXT)", []);
			});
		} else {
			alert("Error createTable: no DBtype");
		}
	}
	
	function loadDataView(db) {
	    var resultBuffer = [];

	    if (dbType === "IDB") {
	        idbObjectStore = db.transaction(DB_TABLE_NAME, "readonly").objectStore(DB_TABLE_NAME);
	        idbObjectStore.openCursor().onsuccess = function(e) {
	            var cursor = e.target.result;

	            if (cursor) {
	                resultBuffer.push(cursor.value);
	                cursor.continue();
	            } else {
	            	
	            	loadData(resultBuffer,"1");

	                return resultBuffer;
	            }
	        };
	    }
	    
	    else if (dbType === "SQL") {
	        db.transaction(function(t) {
	            t.executeSql("SELECT * FROM " + DB_TABLE_NAME, [],
	                function(t, r) {
	                    var i;
	                 
	                    for (i = 0; i < r.rows.length; i++) {
	                    	resultBuffer.push({
	                            id: r.rows.item(i).id || 0,
	                            password: r.rows.item(i).password || "",
	                        });
	                    }
	                    loadData(resultBuffer,"2");
	                    return resultBuffer;
	                },
	                function(t, e) {
	                    alert("Error dataview: " + e.message);

	                    return null;
	                });
	        });
	    }
	}
	
	function loadData(dataArray , msg){

		 var i,
		 	 j,
	         prop;
		 console.log("load Data1" + msg + " " + data.password);

	    for (i = 0; i < dataArray.length; i++) {

	        for (j = 0; j < dataTypeList.length; j++) {
	            prop = dataTypeList[j];
	            if (dataArray[i].hasOwnProperty(prop)) {
	            	if (prop === "id") {
	                    j= j+1;
	                    prop = dataTypeList[j];
	                }
	            	console.log("load Data2" + msg + " " + dataArray[i][prop]);
	                
	                data.password = dataArray[i][prop];
	                
	            }
	        }

	       
	    }

	 
		
	}
		
	document.getElementById("left").addEventListener("click", function() {
		temp = temp + "좌";
	});
	document.getElementById("right").addEventListener("click", function() {
		temp = temp + "우";
	});
	document.getElementById("cancel").addEventListener("click",function(){
		temp = "";
		document.getElementById("blockBTN").style.display = "none";
		tau.widget.Popup(document.getElementById("setting-popup")).close();
	});
	document.getElementById("setpassword").addEventListener("click",
			function() {
				
				data.password = temp;
				submitNewRecord(temp);
				document.getElementById("password-display").innerText = temp;
				temp = "";
				document.getElementById("blockBTN").style.display = "none";
				tau.widget.Popup(document.getElementById("setting-popup")).close();
			});
	
	

	// Insert a data to the table
	function insertData(db, data) {
		if (dbType === "IDB") {
			idbObjectStore = db.transaction(DB_TABLE_NAME, "readwrite")
					.objectStore(DB_TABLE_NAME);
			
			idbObjectStore.put(data);
			console.log("Insert Data1");
		} else if (dbType === "SQL") {
			db.transaction(function(t) {
				
				t.executeSql("INSERT INTO " + DB_TABLE_NAME + " (password) VALUES (?)", [ data.password ]);
				console.log("Insert Data2");
			});
		}
	}

	function openDB(successCb) {
	    var request;

	    if (window.indexedDB) {
	        dbType = "IDB";

	        request = window.indexedDB.open(DB_NAME, DB_VERSION);
	        request.onerror = function(e) {
	            alert("Please allow this application to use Indexed DB");
	        };
	        request.onsuccess = function(e) {
	            db = request.result;

	            onSuccess({
	                message: "Indexed DB loading complete"
	            });

	            if (successCb) {
	                successCb(db);
	            }
	        };
	        request.onupgradeneeded = function(e) {
	            db = e.target.result;

	            onSuccess({
	                message: "Indexed DB upgrade needed"
	            });

	            createTable(db);
	        };
	    } else if (window.openDatabase) {
	        dbType = "SQL";

	        db = openDatabase(DB_NAME, DB_VERSION, DB_DISPLAY_NAME, DB_SIZE, function() {
	            onSuccess({
	                message: "Database Creation Complete"
	            });
	        });
	        createTable(db);
	    } else {
	        onError({
	            message: "Indexed DB/WebSQL is not supported"
	        });
	    }
	}

	// Delete all data from the table
	function deleteDataAll(db) {
		if (dbType === "IDB") {
			idbObjectStore = db.transaction(DB_TABLE_NAME, "readwrite")
					.objectStore(DB_TABLE_NAME);
			idbObjectStore.clear();
		} else if (dbType === "SQL") {
			db.transaction(function(t) {
				t.executeSql("DELETE FROM " + DB_TABLE_NAME + " WHERE id > 0",
						[]);
			});
		}
	}
	
	function submitNewRecord() {
	
	    deleteDataAll(db);
	    console.log("insert db");
	    insertData(db, data);

	    return true;
	}
	
	
	
	//////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////
	
	
	//	ws://168.188.124.204
	var webSocket = new WebSocket("ws://210.111.218.47:80/");
	
	document.getElementById("unlock").addEventListener('click',function(){
		sendMessage("unlock");
		
	});
	document.getElementById("lock").addEventListener('click',function(){
		sendMessage("L");
		
	});
	
	document.getElementById("btn-cancel1").addEventListener('click',function(){
		console.log("btnbtns1");
		tau.widget.Popup(document.getElementById("failPass")).close();
		
		//changePage("main");
		
	});
	
	document.getElementById("btn-cancel2").addEventListener('click',function(){
		console.log("btnbtns2");
		tau.widget.Popup(document.getElementById("successUL")).close();
		//changePage("main");
	});
	
	document.getElementById("btn-cancel3").addEventListener('click',function(){
		console.log("btnbtns3");
		tau.widget.Popup(document.getElementById("successL")).close();
		//changePage("main");
	});
	
		/* If the connection is established */
		webSocket.onopen = function(e) 
		{
		   console.log('connection open, readyState: ' + e.target.readyState);
		   
		};

		/* If the connection fails or is closed with prejudice */
		webSocket.onerror = function(e) 
		{
		   /* Error handling */
			console.log('Error!');
		};
	
	
	function sendMessage(msg) 
	{
	   if (webSocket.readyState === 1) 
	   {
	      webSocket.send(msg);
	      console.log("send msg!");
	   }
	   else{
		   console.log("send err");
	   }
	}
	
	function onchangedCB()
	{
		 if (webSocket.readyState === 1) 
		   {
		      webSocket.send("unlock");
		      console.log("motion suc");
		   }
		   else{
			   console.log("motion err");
		   }
	}
	
	webSocket.onmessage = function(e) 
	{
	   console.log('server message: ' + e.data);
	};
	
	webSocket.onclose = function(e) 
	{
	   console.log('connection close, readyState: ' + e.target.readyState);
	   //closeConnection();
	};
	
	function closeConnection() 
	{
	   if (webSocket.readyState === 1) 
	   {
	      webSocket.close();
	   }
	}
	
	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////
	
	document.getElementById("setting-popup").addEventListener("pagebeforeshow", function() {
		
		leftButton = document.getElementsByClassName("btnleft");
		rightButton = document.getElementsByClassName("btnright");
		
		
		pass = document.getElementById("password");
		prepass = document.getElementById("password-display");
		
	});
	document.getElementById("locker").addEventListener("pagebeforeshow", function() {
		
		tizen.humanactivitymonitor.start("WRIST_UP", onchangedCB);
		
	});
	
	document.getElementById("locker").addEventListener("pagehide", function() {
		
		tizen.humanactivitymonitor.stop("WRIST_UP");
		
	});
	
	document.getElementById("main").addEventListener("pagebeforeshow", function() {
		
		resultDiv = document.getElementById("result");
		password = document.getElementById("password");
		
		
		left = document.getElementById("left");
		right = document.getElementById("right");
		setpass = document.getElementById("setpassword");
		cancel = document.getElementById("cancel");
		
		
		/* Add rotarydetent handler to document */
		document.addEventListener("rotarydetent", rotaryDetentHandler);
		
		openDB(loadDataView);
	});

	
	
	document.getElementById("main").addEventListener("pagehide", function() {
		
		document.removeEventListener("rotarydetent", rotaryDetentHandler);
		
	});
}(tau));
