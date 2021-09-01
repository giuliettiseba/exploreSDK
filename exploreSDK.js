(function () {
  "use strict";
  if (!window.customElements) {
    let script = document.createElement("script");
    script.addEventListener("load", startApp);
    script.src = "js/polyfill-webcomponents-bundle.js";
    document.querySelector("head").appendChild(script);
  } else {
    startApp();
  }

  function loadAccordion(alarm) {
    var newH3 = document.createElement("H3"); // Create the H1 element
    newH3.id = alarm.Id;
    var t = document.createTextNode(alarm.Name); // Create a text element
    newH3.appendChild(t); // Append the text node to the H1 element

    // Convert timeStamp to Date
    const milliseconds = alarm.Timestamp * 1000;
    const dateObject = new Date(milliseconds);
    const localDate = dateObject.toLocaleString();

    let newDiv = document.createElement("div");
    //  newDiv.id = alarm.Id;
    const newP = document.createElement("p");
    var t = document.createTextNode(
      `${localDate} : Priority: ${alarm.Priority} - `
    ); // Create a text element
    newP.appendChild(t);
    newDiv.appendChild(newP);

    const params = {
      cameraId: alarm.CameraId,
      time: alarm.Timestamp,
      width: 450,
      height: 450,
    };
    XPMobileSDK.getThumbnailByTime(params, (thumbnail) => {
      const imageBlob = b64toBlob(thumbnail, "image/jpeg", 512);
      var imageURL = window.URL.createObjectURL(imageBlob);

      var img = $('<img id="dynamic">');
      img.attr("src", imageURL);
      img.attr("id", alarm.Id);
      $(newDiv).append(img);
    });

    let button_close = document.createElement("button");
    button_close.id = alarm.Id;
    button_close.innerHTML = "Close";

    $(button_close).on("click", (event) => {
      console.log(event.target.id);
      const parameters = {
        Id: event.target.id,
        Comment: "Closed From JS",
        State: "e9deec24-e845-4946-aea2-c7c43d916d40",
      };

      XPMobileSDK.updateAlarm(parameters, (result) => {
        console.log(result);
      });
    });

    $(newDiv).append(button_close);

    $(accordion).append(newH3);
    $(accordion).append(newDiv);
  }

  function b64toBlob(b64Data, contentType, sliceSize) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  let alarmSettings;
  function startApp() {
    var params = {
      user: ".\\Administrator",
      pass: "Milestone1$",
      connectionDidLogIn: function () {
        if (!XPMobileSDK.library.Connection.directStreamingServer) {
          alert("Your server does not support Live Direct Streaming!");
        } else {
          /*XPMobileSDK.getOutputsAndEvents((result) => {
            console.log(result);
          });

          // Alarm Metadata
          //Gets settings for alarms (Priority, State).
          XPMobileSDK.getAlarmDataSettings(function (_alarmSettings) {
            alarmSettings = _alarmSettings;
            console.log(alarmSettings);
          });*/

          /// Get Active alarms
          XPMobileSDK.getAlarmList(
            {
              MyAlarms: "NO",
              // Timestamp: 0,
              Count: 13,
              Priority: 1,
              State: "New",
              //State: "60ab3977-090a-4381-a644-8bb51af2fdaa",
              // API filter NOT Working -> REPORT  - Wireshark shows correct message, response is allways full (count is working )
            },
            function (items) {
              console.log(items);

              for (const alarm of items) {
                if (alarm.State == "1") {
                  console.log(alarm);
                  loadAccordion(alarm);
                }

                //console.log(alarm.Id);
                //loadTableData(alarm);

                // get Alarm (no more that what I have in the table - Could be usefull the recieve alarm id )
                //
              }
              $("#accordion").accordion({
                heightStyle: "content",
              });

              // Mouse over -> show alarm details and camara
              $("Table#myTable tr").on({
                mouseenter: function () {},
                mouseleave: function () {},
              });
            }
          );
        }
      },
    };
    LoginManager.loadAndLogin(params);
  }

  jQuery(function () {
    $("input").checkboxradio();
    $("fieldset").controlgroup();

    function handleToggle(e) {
      var target = $(e.target);
      console.log(target);

      var checked = target.is(":checked"),
        value = $("alarm_toggler")
          .filter(":checked")
          .attr("data-" + target[0].id);
      console.log(target[0].name + " " + checked);
    }

    $("input").checkboxradio();
    $(".shape-bar, .brand").controlgroup();
    $(".toggles").controlgroup({
      direction: "horizontal",
    });

    // Bind event handlers
    $(".toggles").on("change", handleToggle);

    $(document).tooltip({
      track: true,
      items: "img",
      content: function () {
        var element = $(this);
        let videoElement = document.createElement("videos-stream");
        console.log(videoElement);

        var id = $(this).closest("img").attr("Id");
        console.log(id);

        XPMobileSDK.getAlarm(id, (alarm) => {
          videoElement.cameraId = alarm.CameraId;
          videoElement.name = alarm.Name;
          videoElement.dispatchEvent(new CustomEvent("start"));

          videoElement.addEventListener(
            "streamReady",
            (event) => {
              XPMobileSDK.playbackSpeed(event.detail.connection, -1);
              //videoElement.dispatchEvent(new CustomEvent("start"));
              /*XPMobileSDK.playbackGoTo(
                event.detail.connection,
                alarm.Timestamp,
                "TimeOrBefore",
                (result) => {
                  console.log(result);
                }
              );*/
            },
            (error) => {
              console.log(error);
            }
          );

          videoElement.addEventListener("fallback", (event) => {
            console.log(event);
            let player =
              event.target.shadow.lastElementChild.getElementsByClassName(
                "player"
              )[0];
            let errorMsg = document.createElement("div");
            errorMsg.innerHTML = "Could not start direct streaming.";
            player?.parentNode.appendChild(errorMsg);
            player?.parentNode.removeChild(player);
            errorMsg = null;
            player = null;
          });
        });

        return videoElement;
      },
    });
  });

  /*
  function loadTableData({
    Id,
    Name,
    Type,
    State,
    Timestamp,
    Source,
    Message,
    Priority,
    CameraId,
    AssignedTo,
    Description,
    StateName,
    PriorityName,
    SourceId,
    MessageId,
    Items,
  }) {
    const table = document.getElementById("testBody");
    //   items.forEach((item) => {
    let row = table.insertRow();
    $(row).attr("Id", Id);

    // Convert timeStamp to Date
    const milliseconds = Timestamp * 1000;
    const dateObject = new Date(milliseconds);
    const localDate = dateObject.toLocaleString();

    // Converr Priority

    //console.log(_alarmSettings);
    console.log(
      alarmSettings.find(({ Name }) => Name === "Priorities").Items //.find(({ Id }) => Id === "Id")
    );
    //.items); //.find((Id) => (id = Priority)));

    let i = 0;
    //row.insertCell(i++).innerHTML = Id;
    row.insertCell(i++).innerHTML = Name;
    row.insertCell(i++).innerHTML = Type;
    row.insertCell(i++).innerHTML = State;
    row.insertCell(i++).innerHTML = localDate;
    row.insertCell(i++).innerHTML = Source;
    row.insertCell(i++).innerHTML = Message;
    row.insertCell(i++).innerHTML = Priority;
    row.insertCell(i++).innerHTML = CameraId;
    row.insertCell(i++).innerHTML = AssignedTo;
    row.insertCell(i++).innerHTML = Description;
    row.insertCell(i++).innerHTML = StateName;
    row.insertCell(i++).innerHTML = PriorityName;
    row.insertCell(i++).innerHTML = SourceId;
    row.insertCell(i++).innerHTML = MessageId;
    row.insertCell(i++).innerHTML = Items;

    const params = {
      cameraId: CameraId,
      time: Timestamp,
      width: 200,
      height: 200,
    };

    XPMobileSDK.getThumbnailByTime(params, (thumbnail) => {
      const imageBlob = b64toBlob(thumbnail, "image/jpeg", 512);
      var imageURL = window.URL.createObjectURL(imageBlob);

      var img = $('<img id="dynamic">');
      img.attr("src", imageURL);
      $(row.insertCell(i++)).append(img);
    });
  }
  */
})();
