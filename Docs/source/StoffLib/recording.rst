Recorder/Recording
=========================

A way to collect and review sequential snapshots of sketches.

.. js:class:: Recorder

 Constructed via methods from ``Sketch.dev``. Only relevant methods are listed.

 **Methods:**

 .. js:function:: hot_at_url(url, overwrite = null)
 
  Allows you to see the latest stage of the recorder at the url. 
  (Usefull for when your programm often crashes later on in your programm during development.)
  Compare ``Sketch.dev.at_url``
 
  **Parameters**:
    - url (*string*)
    - overwrite (*null|boolean*): ``false`` will not overwrite, ``true`` will overwrite and ``null`` will throw an error if trying to overwrite.
    
 .. js:function:: stop_recording()
 
  Returns a new recoding from this recorder.
 
  **Returns**:
    - *Recorder*


.. js:class:: Recording

 Constructed via methods from ``Sketch.dev``. Only relevant methods are listed.

 **Methods:**

 .. js:function:: to_html(url)
 
  Renders the recording to an html string.
 
  **Parameters**:
    - url (*string*)
    - 
  **Returns**:
    - *HTMLstring*


 .. js:function:: save_as_html(path, title = "/StoffLib")
 
  Renders the recording to an html file.
 
  **Parameters**:
    - url (*string*)
  
  **Returns**:
    - *this*

 .. js:function:: at_url(url, overwrite = null)
 
  Compare ``Sketch.dev.at_url``
 
  **Parameters**:
    - url (*string*)
    - overwrite (*null|boolean*): ``false`` will not overwrite, ``true`` will overwrite and ``null`` will throw an error if trying to overwrite.

  **Returns**:
    - *this*

 .. js:function:: stop_recording()
 
  Returns a new recoding from this recorder.
 
  **Returns**:
    - *Recorder*
  
 .. js:function:: hot_at_url(url, overwrite = null)

  Compare ``Recorder.hot_at_url()``
  
 .. js:function:: to_mp4(save_to, fps = 2, width = 700, height = null, extra_padding = 50)

  Renders the recording as a video to an mp4 file. Compare ``Sketch.dev.to_png`` for the width and height attributes.
  
  **Parameters**:
    - save_to (*string*)
    - fps (*number*)
    - width (*number|null*)
    - height (*number|null*)
    - extra_padding (*number*): Extra padding to put at the outside of frames when rendering.
