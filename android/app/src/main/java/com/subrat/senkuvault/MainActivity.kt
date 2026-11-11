package com.subrat.senkuvault

import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.util.Base64
import android.webkit.*
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import java.io.File
import java.io.FileOutputStream

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (filePathCallback != null) {
            val uris = WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
            filePathCallback?.onReceiveValue(uris)
            filePathCallback = null
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        swipeRefresh = findViewById(R.id.swipeRefresh)
        webView = findViewById(R.id.webView)

        setupSwipeRefresh()
        setupWebView()

        // Handle back press
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })

        // Load the live Senku Vault URL
        val targetUrl = "https://subrat-sahu444.github.io/senku-vault/"
        webView.loadUrl(targetUrl)
    }

    private fun setupSwipeRefresh() {
        swipeRefresh.setColorSchemeColors(
            getColor(R.color.senku_green),
            getColor(R.color.senku_cyan),
            getColor(R.color.senku_gold)
        )
        swipeRefresh.setProgressBackgroundColorSchemeColor(getColor(R.color.senku_dark))
        swipeRefresh.setOnRefreshListener {
            webView.reload()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            mediaPlaybackRequiresUserGesture = false
            useWideViewPort = true
            loadWithOverviewMode = true
            cacheMode = WebSettings.LOAD_DEFAULT
            userAgentString = "${userAgentString.replace("; wv", "")} SenkuVaultApp/1.0 SnaptubeEngine/2.0"
        }

        // Bridge native Android downloader to web app
        webView.addJavascriptInterface(WebAppInterface(), "AndroidDownloader")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                swipeRefresh.isRefreshing = false
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                swipeRefresh.isRefreshing = false
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString() ?: return false
                // Handle WhatsApp or external deep links
                if (url.startsWith("whatsapp://") || url.startsWith("https://wa.me/")) {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                        return true
                    } catch (e: Exception) {
                        Toast.makeText(this@MainActivity, "WhatsApp not installed", Toast.LENGTH_SHORT).show()
                        return true
                    }
                }
                return false
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback

                val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                    type = "*/*"
                    addCategory(Intent.CATEGORY_OPENABLE)
                    putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
                }

                try {
                    fileChooserLauncher.launch(intent)
                } catch (e: Exception) {
                    this@MainActivity.filePathCallback = null
                    return false
                }
                return true
            }
        }

        // Native Android Snaptube-grade Download Listener
        webView.setDownloadListener { url, userAgent, contentDisposition, mimeType, contentLength ->
            if (url.startsWith("blob:")) {
                val safeMime = mimeType ?: "video/mp4"
                val js = """
                    (function() {
                        var xhr = new XMLHttpRequest();
                        xhr.open('GET', '$url', true);
                        xhr.responseType = 'blob';
                        xhr.onload = function() {
                            var reader = new FileReader();
                            reader.readAsDataURL(xhr.response);
                            reader.onloadend = function() {
                                if (window.AndroidDownloader) {
                                    var ext = '$safeMime'.indexOf('audio') !== -1 ? 'mp3' : 'mp4';
                                    window.AndroidDownloader.saveBase64(reader.result, '$safeMime', 'Senku_' + Date.now() + '.' + ext);
                                }
                            }
                        };
                        xhr.send();
                    })();
                """.trimIndent()
                webView.evaluateJavascript(js, null)
                return@setDownloadListener
            }

            val filename = URLUtil.guessFileName(url, contentDisposition, mimeType)
            downloadWithManager(url, filename, mimeType)
        }
    }

    fun downloadWithManager(url: String, filename: String, mimeType: String?) {
        runOnUiThread {
            try {
                val effectiveMime = if (mimeType.isNullOrBlank() || mimeType == "application/octet-stream") {
                    if (filename.endsWith(".mp3", true)) "audio/mpeg" else "video/mp4"
                } else {
                    mimeType
                }

                val request = DownloadManager.Request(Uri.parse(url)).apply {
                    setMimeType(effectiveMime)
                    addRequestHeader("User-Agent", webView.settings.userAgentString)
                    setDescription("Downloading with Snaptube Mobile Engine...")
                    setTitle(filename)
                    setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename)
                }
                val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                dm.enqueue(request)
                Toast.makeText(this, "⚡ Snaptube: Download started! Check notifications.", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                try {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                } catch (ex: Exception) {
                    Toast.makeText(this, "Download error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    fun saveBase64File(base64Data: String, mimeType: String, filename: String) {
        try {
            val cleanData = if (base64Data.contains(",")) base64Data.substringAfter(",") else base64Data
            val bytes = Base64.decode(cleanData, Base64.DEFAULT)
            val downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            if (!downloadDir.exists()) downloadDir.mkdirs()
            val file = File(downloadDir, filename)
            FileOutputStream(file).use { it.write(bytes) }
            runOnUiThread {
                Toast.makeText(this, "⚡ Saved to Downloads: $filename", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            runOnUiThread {
                Toast.makeText(this, "Error saving file: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    inner class WebAppInterface {
        @JavascriptInterface
        fun downloadMedia(url: String, filename: String, mimeType: String) {
            downloadWithManager(url, filename, mimeType)
        }

        @JavascriptInterface
        fun saveBase64(base64Data: String, mimeType: String, filename: String) {
            saveBase64File(base64Data, mimeType, filename)
        }

        @JavascriptInterface
        fun isNativeApp(): Boolean {
            return true
        }
    }
}
